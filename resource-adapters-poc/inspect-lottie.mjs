import {inspectAsset} from './intake.mjs';
try{
  if(!process.argv[2])throw new Error('Usage: node inspect-lottie.mjs file.json [rights.json]');
  console.log(JSON.stringify(inspectAsset(process.argv[2],process.argv[3]).receipt,null,2));
}catch(error){console.error(JSON.stringify({status:'blocked',reason:error.message,productionApproved:false}));process.exitCode=2;}
