import type { Metadata } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import { ChemistryLab } from '@/components/education/chemistry/ChemistryLab';
import './chemistry.css';
const display=Bricolage_Grotesque({variable:'--font-chem-display',subsets:['latin'],weight:['400','500','600','700']});
const ui=IBM_Plex_Sans({variable:'--font-chem-ui',subsets:['latin'],weight:['400','500','600']});
export const metadata:Metadata={title:'Elementa — Interactive Chemistry Lab for Classes 6–9 | Nabendu',description:'Explore chemistry with nine virtual labs for CBSE Classes 6–9. Discover particles, separation, acids and bases, atoms and molecules with interactive models, quizzes and a personal notebook.',alternates:{canonical:'/education/chemistry'}};
export default function ChemistryPage(){return <div className={`${display.variable} ${ui.variable}`}><ChemistryLab/></div>}
