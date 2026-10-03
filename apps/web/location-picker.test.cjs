const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

test('le rendez-vous exige un point et conserve ses coordonnées exactes',()=>{
  const handlers={};
  const field=id=>({value:'',addEventListener:(type,fn)=>{handlers[id+type]=fn;}});
  const form={elements:{lat:field('lat'),lng:field('lng'),city:field('city')},addEventListener:(type,fn)=>{handlers[type]=fn;}};
  const status={textContent:''},mapHandlers={};
  const map={setView(){return this;},invalidateSize(){},on(type,fn){mapHandlers[type]=fn;return this;}};
  const marker={addTo(){return this;},on(){return this;},setLatLng(){},remove(){}};
  const context={window:{},document:{getElementById:id=>id==='createForm'?form:status},cityCoordinates:{Paris:[48.857,2.352]},requestAnimationFrame:fn=>fn(),L:{map:()=>map,tileLayer:()=>({addTo:()=>({on(){}})}),marker:()=>marker,divIcon:()=>({})}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'location-picker.js'),'utf8'),context);
  const picker=context.window.PlayLinkLocation;
  picker.open();
  form.elements.city.value='Paris';handlers.citychange();
  assert.throws(()=>picker.read(),/Place le point/);
  mapHandlers.click({latlng:{lat:48.841234,lng:2.311234}});
  assert.equal(picker.read()[0],48.841234);
  assert.equal(picker.read()[1],2.311234);
  handlers.citychange();
  assert.equal(picker.read()[0],48.841234,'changer de ville ne remplace pas le point');
  form.elements.lat.value='91';assert.throws(()=>picker.read(),/Place le point/);
  form.elements.lat.value='';assert.throws(()=>picker.read(),/Place le point/);
});
