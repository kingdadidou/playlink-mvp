/* Launch profile: general level plus ranking, division or fundamental pace. */
(() => {
 const text=(key,label,placeholder)=>({key,label,placeholder,type:'text'});
 const division=text('division','Division','Ex. loisir, départemental, régional, national');
 const schemas={
  'Athlétisme':[text('pace','Allure fondamentale (min/km)','Ex. 6:00')],
  'Badminton':[text('ranking','Classement','Ex. non classé, P, D, R ou N')],
  'Basket':[division],
  'Beach-volley':[division],
  'Boxe':[],
  'Street workout':[],
  'Cyclisme':[],
  'Danse':[],
  'Sports de skatepark':[],
  'Football':[text('division','Division','Ex. loisir, D3, D1, R2, R1, N3')],
  'Five':[division],
  'Musculation':[],
  'Tennis':[text('ranking','Classement','Ex. non classé, 30/2, 15/4')],
  'Volley-ball':[division],
  'Trail':[],
  'Rugby':[text('division','Division','Ex. loisir, régional, fédéral')],
  'Escalade':[],
  'Running':[],
  'Natation':[],
  'Autre':[]
 };
 window.PlayLinkSportFields=schemas;
})();
