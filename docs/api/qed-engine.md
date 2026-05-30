# QED Engine API

```ts
import { QEDEngine } from "@/engine/qed_calculator";

const e = new QEDEngine(/* precision */ 1e-11, /* loops */ 6);
e.calculateAe();   // → 1.15965218…e-3
e.getResidual();   // → < 1e-11
e.converged();     // → true
```

Coefficients: Schwinger 1948 (1-loop), Sommerfield/Petermann (2-loop),
Laporta/Remiddi (3-loop), Kinoshita et al. (4–5), Aoyama et al. 2020 (6-loop).
