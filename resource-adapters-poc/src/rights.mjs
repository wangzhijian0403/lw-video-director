// Validates a human rights declaration, not the legal truth of a web page.
export function checkRights(record,assetSha256,evidenceSha256,purpose='render'){
  if(!record)return {status:'reference-only',reason:'No reviewed rights declaration'};
  if(!record.assetId||!record.author||!record.reviewedBy||!record.sourceUrl||!record.license)throw new Error('Missing rights provenance/reviewer');
  if(!/^(https:\/\/|repository:)/.test(record.sourceUrl))throw new Error('Unsupported source URL');
  if(record.assetSha256!==assetSha256||record.evidence?.sha256!==evidenceSha256)throw new Error('Rights evidence or asset hash mismatch');
  const stock={
    'Mixkit-SFX-Free':'https://mixkit.co/license/modal/sfxFree/',
    'Pixabay-Content-License':'https://pixabay.com/service/license-summary/',
    'Lottie-Simple-FL-9.13.21':'https://lottiefiles.com/page/license'
  };
  if(!['MIT','ISC','Apache-2.0','CC0-1.0','CC-BY-4.0',...Object.keys(stock)].includes(record.license))throw new Error('License requires separate review outside POC');
  if(!['render','redistribute'].includes(purpose))throw new Error('Unknown rights purpose');
  if(stock[record.license]&&record.licenseUrl!==stock[record.license])throw new Error('Stock license needs its reviewed official URL');
  for(const scope of ['download','adapt','render'])if(record.rightsScopes?.[scope]!==true)throw new Error(`Missing right: ${scope}`);
  if(['Mixkit-SFX-Free','Pixabay-Content-License'].includes(record.license)){
    if(record.rightsScopes?.redistribute!==false||record.conditions?.endProductOnly!==true)throw new Error('Stock audio is end-product-only; raw redistribution is not granted');
    if(purpose==='redistribute')throw new Error('Raw stock redistribution blocked');
  }
  if(record.license==='Lottie-Simple-FL-9.13.21'&&(record.conditions?.preserveAssetLicense!==true||record.conditions?.noCompetingLibrary!==true))throw new Error('Lottie asset license conditions must be preserved');
  if(purpose==='redistribute'&&record.rightsScopes?.redistribute!==true)throw new Error('Missing right: redistribute');
  if(!record.attribution?.trim())throw new Error('Missing attribution');
  return {status:'declaration-validated',reason:'Human declaration and local evidence hashes match; render not yet tested'};
}
