#!/usr/bin/env python3
"""Build a 1,000,000-row subset of azuregroove's Gaia DR3 100–500 pc octree.

Download selected source tiles via GitHub CLI (requires network), or use --cache
with previously downloaded tiles. See public/data/gaia-dr3-1m.json for provenance.
Output: 16-byte header G3N1/version/count/stride followed by little-endian
x,y,z (float32 pc, heliocentric Galactic), source_id (uint64), G*10 (uint8),
(BP-RP+1)*40 (uint8), 2 reserved bytes. The input positions are quantized.
"""
import argparse
from array import array
from concurrent.futures import ThreadPoolExecutor
import gzip
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys

COMMIT='59fcf5d6cf3103f6d9a5ca91f4784bbd07d9c17d'
ROOT=Path(__file__).resolve().parents[1]
COUNT=1_000_000

def get(path):
    return subprocess.check_output(['gh','api',f'repos/azuregroove/galaxie-data/contents/{path}?ref={COMMIT}','-H','Accept: application/vnd.github.raw+json'])

def decode(values,typ):
    a=array(typ);a.frombytes(values)
    if sys.byteorder!='little':a.byteswap()
    return a

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,default=ROOT/'gaia-source-cache');ap.add_argument('--index',type=Path);args=ap.parse_args()
    index=json.loads(args.index.read_bytes() if args.index else get('gaia500/index.json'))
    assert index['schema']==1 and index['polovina_pc']==512 and not index['test']
    nodes=[];total=0
    for key,count in index['uzly']:
        nodes.append((key,count));total+=count
        if total>=COUNT:break
    if total<COUNT:raise ValueError('Not enough source records')
    def download(job):
        kind,key=job;path=args.cache/kind/(key+'.bin.gz');path.parent.mkdir(parents=True,exist_ok=True)
        if not path.exists():path.write_bytes(get(f'gaia500/{kind}/{key}.bin.gz'))
    with ThreadPoolExecutor(max_workers=8) as executor:list(executor.map(download,[(kind,key) for key,_ in nodes for kind in ('b','i')]))
    out=ROOT/'public/data/gaia-dr3-1m.bin';seen=set();written=0;used=[]
    with out.open('wb') as f:
        f.write(struct.pack('<4sIII',b'G3N1',1,COUNT,24))
        for key,n in nodes:
            body=gzip.decompress((args.cache/'b'/(key+'.bin.gz')).read_bytes());ids=gzip.decompress((args.cache/'i'/(key+'.bin.gz')).read_bytes())
            if len(body)!=n*8 or len(ids)!=n*8:raise ValueError(f'Bad lengths for {key}')
            xyz=[decode(body[i*n*2:(i+1)*n*2],'h') for i in range(3)]
            lo=decode(ids[:n*4],'I');hi=decode(ids[n*4:],'I');g=body[6*n:7*n];color=body[7*n:8*n]
            half=512.;center=[0.,0.,0.]
            for char in key[1:]:
                half/=2;octant=int(char)
                for axis in range(3):center[axis]+=half if octant&(1<<axis) else -half
            take=min(n,COUNT-written);packed=bytearray(take*24)
            for i in range(take):
                ident=lo[i]|hi[i]<<32
                if ident in seen:raise ValueError(f'Duplicate Gaia source {ident}')
                seen.add(ident)
                coords=[center[j]+xyz[j][i]*half/32767 for j in range(3)]
                if not 95<sum(c*c for c in coords)**.5<505:raise ValueError(f'Invalid distance {key} {coords}')
                struct.pack_into('<fffQBBH',packed,24*i,*coords,ident,g[i],color[i],0)
            f.write(packed);written+=take;used.append({'node':key,'source_count':n,'used':take})
            if written==COUNT:break
    assert written==COUNT
    digest=hashlib.sha256(out.read_bytes()).hexdigest()
    metadata={'format':'G3N1','version':1,'count':written,'stride':24,'bytes':out.stat().st_size,'sha256':digest,'source':'ESA/Gaia/DPAC Gaia DR3 via azuregroove/galaxie-data','source_commit':COMMIT,'upstream_retrieved':'2026-10-03T17:33:54Z','selection':'First 1,000,000 records in breadth-first upstream node order, last node truncated. Upstream selection: 100–500 pc, parallax > 2 mas, parallax_over_error > 10; excludes GCNS and parallax > 10 mas. Not a complete or unbiased sample.','coordinates':'heliocentric Galactic Cartesian parsecs: x toward Galactic center, y toward longitude 90 degrees, z toward Galactic north; quantized by upstream. Distances are inverse parallax, not independent measurements.','photometry':'G magnitude and BP-RP colour as upstream byte quantization; 255 indicates missing.','nodes':used}
    (ROOT/'public/data/gaia-dr3-1m.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(f'Wrote {written:,} unique sources ({out.stat().st_size:,} bytes), sha256 {digest}')
if __name__=='__main__':main()
