import importlib.util,unittest,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('catalog',ROOT/'scripts/resource_catalog.py');catalog=importlib.util.module_from_spec(spec);spec.loader.exec_module(catalog)
class ResourceCatalogTests(unittest.TestCase):
    def test_original_references_preserve_item_status(self):
        found=catalog.search('MP-001',items=True);self.assertEqual(len(found),1);self.assertTrue(found[0]['executable']);self.assertEqual(found[0]['renderStatus'],'passed')
    def test_provider_discovery_does_not_upgrade_unadapted_sources(self):
        providers=catalog.search();self.assertEqual(len(providers),26);self.assertEqual(len({p['id'] for p in providers}),26)
        p=next(x for x in providers if x['id']=='alchaincyf/huashu-art-motion');self.assertEqual(p['adapterStatus'],'not-adapted');self.assertEqual(p['renderStatus'],'not-run')
    def test_audio_filter_and_mixed_licenses_remain_explicit(self):
        self.assertEqual({p['id'] for p in catalog.search(kind='audio')},{'mixkit-sfx','pixabay-audio','freesound','envato-elements'})
        p=next(x for x in catalog.search() if x['id']=='lemomo-ai/lemo-opuscar');self.assertIn('Mixed',p['license'])
    def test_unknown_audio_id_never_starts_download(self):
        spec=importlib.util.spec_from_file_location('fetch_audio',ROOT/'scripts/fetch_reference_audio.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
        with self.assertRaisesRegex(ValueError,'Unknown'):m.fetch('not-reviewed',ROOT/'must-not-be-created')
        self.assertFalse((ROOT/'must-not-be-created').exists())
if __name__=='__main__':unittest.main()
