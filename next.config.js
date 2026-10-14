/** @type {import('next').NextConfig} */

/**
 * Headers de segurança aplicados a todas as rotas (docs §8).
 * HSTS só em produção (evita advertência em localhost / dev).
 * CSP fica como TODO documentado: um CSP restritivo precisa de revisão
 * (runtime inline do Next + Recharts) para não quebrar dev/build — tratar
 * com nonce em fase posterior antes de habilitar.
 */

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // TODO(futuro): CSP restritiva (script-src 'self' + nonce; connect-src https://*.supabase.co).
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
