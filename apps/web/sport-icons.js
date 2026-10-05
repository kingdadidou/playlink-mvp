/* Small original SVG pictograms shared by event cards and map markers. */
(() => {
 const ball='<circle cx="12" cy="12" r="9"/><path d="m12 7 4.8 3.5-1.8 5.6H9l-1.8-5.6L12 7Z" fill="currentColor" stroke="none"/><path d="M12 7V3m4.8 7.5 3.8-1.3M15 16.1l2.4 3.1M9 16.1l-2.4 3.1m.6-8.7L3.4 9.2"/>';
 const runner='<path d="M3 8h4l2 3 4-4 2 5 4 2c2 1 3 2 3 4v2H3a1 1 0 0 1-1-1v-8l1-3Z"/><path d="M2 17h20M9 11l3 1m-1-3 3 1M3 8l2 5h3"/>';
 const racket='<ellipse cx="14" cy="8" rx="5" ry="6" transform="rotate(35 14 8)"/><path d="m10 13-6 8m7-17 7 5m-9-2 7 5m-4-9-3 9m7-7-4 9"/>';
 const volley='<circle cx="12" cy="12" r="8"/><path d="M12 4c-2 3-2 6 0 8m0 0c4 0 6 2 7 4m-7-4c-2 3-4 5-7 5m7-10c3 0 6 2 7 5M6 8c-1 4 0 7 3 10m5 1c2-1 3-3 3-5"/>';
 const icons={
  'Football':[ball,'#35634a'],'Five':[ball,'#35634a'],
  'Basket':['<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4v16M6 6c7 1 11 5 12 12M6 18C7 11 11 7 18 6"/>','#c15c30'],
  'Tennis':[racket,'#727c32'],'Badminton':['<path d="m5 4 2 10h10l2-10-7 4-7-4Zm2 10 2 5h6l2-5M9 5l1 9m5-9-1 9M7 14h10"/>','#727c32'],
  'Running':[runner,'#b75339'],'Athlétisme':[runner,'#b75339'],'Trail':[runner,'#b75339'],
  'Volley-ball':[volley,'#477d8b'],'Beach-volley':[volley,'#477d8b'],
  'Boxe':['<path d="M8 17 5 12V7c0-3 8-4 11-1l1 5 3 2-2 5H8Zm0 0v4h9v-3M7 9h6m-6 3h5"/>','#9c4b52'],
  'Street workout':['<path d="M3 4h18M6 4v5l6 3 6-3V4m-6 8v5l-4 5m4-5 4 5"/><circle cx="12" cy="8" r="2"/>','#57608a'],
  'Musculation':['<path d="M7 12h10M3 8v8m4-10v12m10-12v12m4-10v8M3 12h4m10 0h4"/>','#57608a'],
  'Cyclisme':['<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="m6 16 5-9 7 9H6l-2-9m4 0h5m1-4h3l1 13"/>','#387d79'],
  'Danse':['<path d="m10 3 7 4-4 11c-1 3-4 4-6 2s-2-4-1-6l4-11Z"/><path d="m10 3 2 7 5-3m-5 3-4 7m-2-1 7 3M10 3l6-1-1 4"/>','#a3567c'],
  'Sports de skatepark':['<path d="m3 12 3 3h12l3-3M6 9l5 2 5-3"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>','#8a6344'],
  'Rugby':['<ellipse cx="12" cy="12" rx="5" ry="10" transform="rotate(45 12 12)"/><path d="m8 16 8-8m-7 4 3 3m0-6 3 3"/>','#80644b'],
  'Escalade':['<circle cx="13" cy="4" r="2"/><path d="m3 2 2 6-2 6 2 8m1-12 6-3 6 3 3-3m-9 0 1 7-5 6m5-6 5 2 2 6"/>','#8a6344'],
  'Natation':['<path d="M2 20q3-3 6 0t6 0 6 0M2 16q3-3 6 0t6 0 6 0m-17-5 7-5 5 5-5 3"/><circle cx="18" cy="10" r="2"/>','#477d8b'],
  'Autre':['<path d="m12 3 2.5 5 5.5 1-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1L12 3Z"/>','#627066']
 };
 const get=s=>icons[s]||icons.Autre;
 window.PlayLinkSportIcon={color:s=>get(s)[1],svg:s=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${get(s)[0]}</svg>`};
})();
