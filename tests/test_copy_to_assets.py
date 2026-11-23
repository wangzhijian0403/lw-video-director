"""文案自动选材：必须复用现有素材引擎，不伪造可渲染结果。"""
import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from lw_assets import (AssetIndex, intents_from_copy, recommend, select_for_copy,
                        seed_workbench_assets)

class CopyToAssetsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.index = AssetIndex(Path(self.tmp.name) / 'project')
        self.seed = seed_workbench_assets(self.index, 'private-test', include_motion_prompt=False)
        self.assertEqual(self.seed['libraries'], ['lw-originals'])

    def tearDown(self):
        self.index.close(); self.tmp.cleanup()

    def test_copy_drafts_reviewable_intent_not_a_semantic_claim(self):
        intents = intents_from_copy('为什么画面动了还是讲不清？先把信息分层。')
        self.assertEqual(len(intents), 2)
        self.assertTrue(all(i['reviewRequired'] for i in intents))
        self.assertEqual(intents[0]['derivation'], 'rule-cue')
        self.assertEqual(intents[0]['purpose'], 'hook')
        self.assertIn('communication', intents[0]['concepts'])
        self.assertIn('规则线索映射', intents[0]['analysisEvidence'])
        self.assertTrue(intents[0]['sourceText'].startswith('为什么'))

    def test_unmatched_copy_uses_disclosed_position_default(self):
        intent = intents_from_copy('天气不错。风向有点变化。我们继续走。')[0]
        self.assertEqual(intent['derivation'], 'position-default')
        self.assertIn('位置默认', intent['analysisEvidence'])
        self.assertTrue(intent['reviewRequired'])

    def test_copy_bridge_uses_existing_recommendation_pipeline(self):
        result = select_for_copy(self.index,
            '为什么画面动了还是讲不清？先把信息分层。镜头运动要引导视线。',
            'private-test', libraries=['lw-originals'])
        self.assertEqual(result['engine'], 'lw_assets.select_for_copy')
        self.assertTrue(result['reviewRequired'])
        self.assertEqual(result['shotCount'], 3)
        for shot in result['shots']:
            self.assertTrue(shot['asset'])
            self.assertEqual(shot['asset']['library'], 'lw-originals')
            self.assertTrue(shot['decision']['recommendations'])
            self.assertIn(shot['text'][:8], shot['decision']['intent']['analysisEvidence'])

    def test_library_filter_cannot_select_another_library(self):
        result = select_for_copy(self.index, '为什么画面动了还是讲不清？',
                                 'private-test', libraries=['user-local'])
        shot = result['shots'][0]
        self.assertIsNone(shot['asset'])
        self.assertIsNone(shot['decision']['selectedAssetId'])
        self.assertTrue(shot['decision']['error'])

    def test_empty_index_returns_honest_block_not_a_fake_asset(self):
        empty = AssetIndex(Path(self.tmp.name) / 'empty')
        try:
            result = select_for_copy(empty, '为什么画面动了还是讲不清？', 'private-test')
            self.assertIsNone(result['shots'][0]['asset'])
            self.assertIn('error', result['shots'][0]['decision'])
        finally: empty.close()

    def test_raw_copy_is_still_rejected_as_an_intent(self):
        with self.assertRaises(ValueError):
            recommend(self.index, {'narration': '为什么画面动了还是讲不清？'})

    def test_shot_count_is_bounded(self):
        with self.assertRaises(ValueError):
            intents_from_copy('一句话。', max_shots=99)
        with self.assertRaises(ValueError):
            intents_from_copy('')

if __name__ == '__main__': unittest.main()
