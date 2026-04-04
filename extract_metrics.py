import subprocess
import json
import csv
import sys

def extract_metrics(filepath):
    hal = subprocess.run(
        ['radon', 'hal', filepath, '-j'],
        capture_output=True, text=True
    )
    cc = subprocess.run(
        ['radon', 'cc', filepath, '-j'],
        capture_output=True, text=True
    )

    hal_data = json.loads(hal.stdout)
    cc_data  = json.loads(cc.stdout)

    rows = []

    for file_key, file_data in hal_data.items():

        # Build cyclomatic complexity lookup by function name
        cc_funcs = {}
        if file_key in cc_data:
            for f in cc_data[file_key]:
                cc_funcs[f['name']] = f.get('complexity', 1)

        # Total file metrics
        total = file_data.get('total', {})

        # Functions is a DICT not a list → { "process": {...}, "add": {...} }
        functions = file_data.get('functions', {})

        for func_name, h in functions.items():

            n        = h.get('length', 0)
            v        = h.get('volume', 0)
            d        = h.get('difficulty', 0)
            e        = h.get('effort', 0)
            b        = h.get('bugs', 0)
            t        = h.get('time', 0)
            l        = round(1/d, 4) if d > 0 else 0
            i        = round(v/d, 4) if d > 0 else 0
            uniq_Op  = h.get('h1', 0)
            uniq_Opnd= h.get('h2', 0)
            total_Op = h.get('N1', 0)
            total_Opnd = h.get('N2', 0)

            v_g      = cc_funcs.get(func_name, 1)
            loc      = total_Op + total_Opnd
            lOCode   = max(1, int(loc * 0.7))
            lOComment= max(0, int(loc * 0.1))
            lOBlank  = max(0, int(loc * 0.1))
            locCodeAndComment = lOComment
            ev_g     = max(1, v_g - 2)
            iv_g     = max(1, v_g - 1)
            branchCount = max(0, (v_g - 1) * 2)

            rows.append({
                'function':           func_name,
                'loc':                loc,
                'v(g)':               v_g,
                'ev(g)':              ev_g,
                'iv(g)':              iv_g,
                'n':                  n,
                'v':                  round(v, 2),
                'l':                  l,
                'd':                  round(d, 2),
                'i':                  round(i, 2),
                'e':                  round(e, 2),
                'b':                  round(b, 4),
                't':                  round(t, 2),
                'lOCode':             lOCode,
                'lOComment':          lOComment,
                'lOBlank':            lOBlank,
                'locCodeAndComment':  locCodeAndComment,
                'uniq_Op':            uniq_Op,
                'uniq_Opnd':          uniq_Opnd,
                'total_Op':           total_Op,
                'total_Opnd':         total_Opnd,
                'branchCount':        branchCount,
            })

    return rows

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'test_code.py'
    rows = extract_metrics(filepath)

    if not rows:
        print("No functions found!")
    else:
        output = filepath.replace('.py', '_metrics.csv')
        with open(output, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)

        print(f"Saved to {output}")
        print(f"Extracted {len(rows)} functions\n")
        for r in rows:
            print(f"  {r['function']:20s} → v(g)={r['v(g)']:3d}  branchCount={r['branchCount']:3d}  loc={r['loc']}")