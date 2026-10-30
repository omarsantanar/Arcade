export const DRIVING_BEST_KEY='arcade:driving-rd:best-v1';
export function readDriveBest():number{
  try{return Math.max(0,Number(window.localStorage.getItem(DRIVING_BEST_KEY))||0);}
  catch{return 0;}
}
export function storeDriveBest(score:number):void{
  try{window.localStorage.setItem(DRIVING_BEST_KEY,String(Math.max(readDriveBest(),score)));}
  catch{/* optional storage */}
}
