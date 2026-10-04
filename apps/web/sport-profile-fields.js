/* Optional, self-reported sporting references; no automatic skill score. */
(() => {
 const text=(key,label,placeholder)=>({key,label,placeholder,type:'text'});
 const number=(key,label,min,max,step='1')=>({key,label,type:'number',min,max,step});
 const choice=(key,label,options)=>({key,label,options});
 const pace=text('pace','Allure habituelle (min/km)','Ex. 5:30');
 const sessions=number('sessions','Séances par semaine',0,30);
 const schemas={
  'Athlétisme':[choice('discipline','Discipline',['Sprint','Demi-fond','Fond','Haies','Sauts','Lancers','Épreuves combinées']),pace,text('performance','Épreuve et chrono / performance','Ex. 1 500 m en 5:10 ou longueur à 4,50 m')],
  'Badminton':[choice('format','Format pratiqué',['Simple','Double','Mixte']),text('ranking','Classement ou série','Ex. loisir, P, D, R ou N'),sessions],
  'Basket':[text('division','Division ou championnat','Ex. loisir, départemental, régional, national'),choice('position','Poste',['Meneur','Arrière','Ailier','Ailier fort','Pivot','Polyvalent']),sessions],
  'Beach-volley':[choice('format','Format pratiqué',['2 contre 2','3 contre 3','4 contre 4','Loisir']),text('competition','Circuit ou niveau de compétition','Ex. loisir, tournois locaux, régional'),sessions],
  'Boxe':[choice('discipline','Discipline',['Anglaise','Française / savate','Kick-boxing','Muay-thaï','Autre']),number('years','Années de pratique',0,80,'0.5'),choice('practice','Pratique',['Sans opposition','Assaut / opposition légère','Sparring encadré','Compétition'])],
  'Street workout':[number('pullups','Tractions strictes consécutives',0,200),number('pushups','Pompes consécutives',0,500),text('skills','Figures maîtrisées','Ex. muscle-up, handstand, front lever')],
  'Cyclisme':[choice('discipline','Pratique',['Route','VTT','Gravel','Urbain','Autre']),number('distance','Distance habituelle (km)',0.1,1000,'0.1'),number('speed','Vitesse moyenne habituelle (km/h)',1,80,'0.1')],
  'Danse':[text('style','Style de danse','Ex. salsa, hip-hop, contemporain'),number('years','Années de pratique',0,80,'0.5'),choice('practice','Cadre de pratique',['Découverte','Cours réguliers','Pratique libre','Spectacles','Compétition'])],
  'Sports de skatepark':[choice('discipline','Discipline',['Skateboard','BMX','Roller','Trottinette','Autre']),number('years','Années de pratique',0,80,'0.5'),text('skills','Modules / figures maîtrisés','Ex. rampe, bowl, ollie, drop-in')],
  'Football':[text('division','Division ou championnat','Ex. loisir, D3, D1, R2, R1, N3'),choice('position','Poste',['Gardien','Défenseur','Milieu','Attaquant','Polyvalent']),sessions],
  'Five':[choice('practice','Cadre de pratique',['Occasionnel','Régulier','Ligue / championnat','Tournois']),choice('position','Poste',['Gardien','Défenseur','Milieu','Attaquant','Polyvalent']),sessions],
  'Musculation':[number('years','Années de pratique',0,80,'0.5'),sessions,text('reference','Exercice et charge de travail','Ex. squat : 3 séries de 8 à 60 kg')],
  'Tennis':[text('ranking','Classement','Ex. non classé, 30/2, 15/4'),choice('format','Format pratiqué',['Simple','Double','Les deux']),sessions],
  'Volley-ball':[text('division','Division ou championnat','Ex. loisir, départemental, régional, national'),choice('position','Poste',['Passeur','Réceptionneur-attaquant','Central','Pointu','Libéro','Polyvalent']),sessions],
  'Trail':[number('distance','Distance habituelle (km)',0.1,500,'0.1'),number('elevation','Dénivelé positif habituel (m)',0,30000),text('reference','Course ou sortie de référence','Ex. 20 km / 800 m D+ en 2 h 30')],
  'Rugby':[choice('format','Format pratiqué',['À XV','À XIII','À 7','Touch / sans contact']),text('division','Division ou championnat','Ex. loisir, régional, fédéral'),text('position','Poste','Ex. pilier, demi de mêlée, ailier')],
  'Escalade':[choice('discipline','Discipline',['Bloc','Voie','Les deux']),text('grade','Cotation habituelle','Ex. voie 6a en tête ou bloc 5c'),choice('practice','Pratique',['Salle','Falaise / extérieur','Les deux'])],
  'Running':[pace,number('distance','Distance habituelle (km)',0.1,300,'0.1'),text('reference','Distance et chrono de référence','Ex. 10 km en 50:00')],
  'Natation':[choice('stroke','Nage principale',['Crawl','Brasse','Dos','Papillon','Plusieurs nages']),text('pace','Allure habituelle (min/100 m)','Ex. 2:10'),number('distance','Distance sans pause (m)',25,50000,'25')],
  'Autre':[text('discipline','Nom du sport','Ex. padel'),number('years','Années de pratique',0,80,'0.5'),text('reference','Repère de niveau','Classement, performance ou expérience')]
 };
 window.PlayLinkSportFields=schemas;
})();
