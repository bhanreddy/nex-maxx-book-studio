import type {GradeBand,SubjectDomain} from '../../../domain/educational/blockSchema';
const recentKey='nex-educational-recent';
export function recentEducationalPresets():string[]{try{const value=JSON.parse(localStorage.getItem(recentKey)||'[]');return Array.isArray(value)?value.filter((id):id is string=>typeof id==='string').slice(0,12):[];}catch{return [];}}
export function recordEducationalPreset(id:string){if(typeof window==='undefined')return;try{localStorage.setItem(recentKey,JSON.stringify([id,...recentEducationalPresets().filter(value=>value!==id)].slice(0,12)));window.dispatchEvent(new Event('nex-educational-recent'));}catch{}}
export function resolveBookSubject(subject:string):SubjectDomain{
 const subjects:Record<string,SubjectDomain>={mathematics:'mathematics',math:'mathematics',maths:'mathematics',science:'science',english:'english','environmental studies':'environmental',evs:'environmental',environmental:'environmental','social studies':'social-studies','social-studies':'social-studies','computer science':'computer-science',computer:'computer-science',technology:'computer-science','computer-science':'computer-science','early learning':'early-learning','early-learning':'early-learning','general knowledge':'general',general:'general'};
 return subjects[subject.toLowerCase().trim()]||'general';
}
export function resolveBookGrade(grade:string):GradeBand{if(/nursery|lkg|ukg/i.test(grade))return 'early-years';const number=Number(grade.match(/\d+/)?.[0]||3);return number<=2?'primary-lower':number<=5?'primary-upper':number<=8?'middle-school':'secondary-plus';}
