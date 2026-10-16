"""navrhy/shared/kraje.json: id plesu -> kraj (z PSČ/obce dle číselníku obcí)."""
import json,sys
sys.path.insert(0,'/workspace/plesy/work');from norm import OB
P=json.load(open('data/plesy.json'));P=P if isinstance(P,list) else P['plesy']
old=json.load(open('navrhy/shared/kraje.json'))
out={};miss=0
for p in P:
  rs=OB.get(p['obec'],[]);ps=(p.get('psc') or '').replace(' ','')
  r=next((x for x in rs if x['PSČ']==ps),rs[0] if rs else None)
  if r: out[str(p['id'])]=r['Kraj']
  elif p.get('lat'):
    best=min((r for v in OB.values() for r in v if r.get('Latitude')),key=lambda r:(float(r['Latitude'])-p['lat'])**2+((float(r['Longitude'])-p['lon'])*0.65)**2)
    out[str(p['id'])]=best['Kraj']
  else: miss+=1
json.dump(out,open('navrhy/shared/kraje.json','w'),ensure_ascii=False)
print(len(out),'bez kraje',miss)
