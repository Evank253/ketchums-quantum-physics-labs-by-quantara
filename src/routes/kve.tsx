import { createFileRoute } from "@tanstack/react-router";
import { KveLab } from "@/components/kve-lab";

export const Route = createFileRoute("/kve")({
  component: KveLab,
  head: () => ({
    meta: [
      { title: "KVE — Scalar-Field Cosmology Lab | Quantara" },
      {
        name: "description",
        content:
          "Interactive in-browser scalar-field dark-energy cosmology simulator. Evolves φ, w(a), H(a), and matter growth D(a) with live CPL fit.",
      },
      { property: "og:title", content: "KVE — Scalar-Field Cosmology Lab" },
      {
        property: "og:description",
        content:
          "Canonical scalar-field FRW cosmology with exponential potential, solved live in your browser.",
      },
    ],
  }),
});
