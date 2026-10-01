import json,re
html=json.load(open('html-blocks.json'))
sq=lambda s: re.sub(r'[^a-z0-9]','',s.lower().replace('’',"'").replace('“','"').replace('”','"'))
rep=[]; tot_ok=tot=0
for n in range(1,10):
    pdf=open(f'pdf-p{n}.txt').read()
    ps=sq(pdf)
    blocks=html[f'page-{n}']['blocks']
    missing=[]
    residue=ps
    for b in blocks:
        s=sq(b)
        if not s: continue
        tot+=1
        if s in ps:
            tot_ok+=1; residue=residue.replace(s,'',1)
        else: missing.append(b)
    rep.append((n,len(blocks),missing,residue))
for n,c,m,r in rep:
    print(f"== page {n}: {c} HTML blocks, {c-len(m)} found verbatim in PDF text")
    for x in m: print("   NOT IN PDF TEXT:",x)
    print("   PDF residue not in HTML (squashed):", r[:300])
print(tot_ok,"/",tot)
