/**
 * Bentuk JSON yang dipahami Traefik HTTP provider (`providers.http.endpoint`)
 * — SAMA persis skema dynamic-config file YAML Traefik. Port dari
 * bagdja-auction-api (`domains/dto/traefik-dynamic-config.dto.ts`), lihat
 * dokblock itu untuk alasan kenapa `services` didefinisikan ulang di sini
 * (self-contained, bukan referensi cross-provider `nama@file`). Dipakai
 * `TraefikConfigController` — bukan kontrak API publik, jangan expose ke
 * Swagger.
 */
export interface TraefikDynamicConfig {
  http: {
    routers: Record<string, TraefikRouterConfig>;
    services: Record<string, TraefikServiceConfig>;
  };
}

export interface TraefikRouterConfig {
  rule: string;
  entryPoints: string[];
  /** Selalu objek kosong — SENGAJA tidak ada `certResolver` (lihat `PlatformDomainsService.buildTraefikDynamicConfig`). */
  tls: Record<string, never>;
  service: string;
}

export interface TraefikServiceConfig {
  loadBalancer: {
    passHostHeader: true;
    servers: [{ url: string }];
  };
}

/**
 * Serialisasi YAML manual (BUKAN library) — port persis dari
 * bagdja-auction-api, alasan sama: bentuknya sempit & sudah pasti, tidak
 * butuh dependency `js-yaml` cuma untuk kasus ini.
 */
export function toTraefikYaml(config: TraefikDynamicConfig): string {
  const lines: string[] = ['http:', '  routers:'];

  for (const [name, router] of Object.entries(config.http.routers)) {
    lines.push(`    ${name}:`);
    lines.push(`      rule: '${router.rule.replace(/'/g, "''")}'`);
    lines.push('      entryPoints:');
    for (const ep of router.entryPoints) lines.push(`        - ${ep}`);
    lines.push('      tls: {}');
    lines.push(`      service: ${router.service}`);
  }
  if (Object.keys(config.http.routers).length === 0) {
    lines.push('    {}');
  }

  lines.push('  services:');
  for (const [name, service] of Object.entries(config.http.services)) {
    lines.push(`    ${name}:`);
    lines.push('      loadBalancer:');
    lines.push('        passHostHeader: true');
    lines.push('        servers:');
    for (const server of service.loadBalancer.servers) {
      lines.push(`          - url: '${server.url.replace(/'/g, "''")}'`);
    }
  }
  if (Object.keys(config.http.services).length === 0) {
    lines.push('    {}');
  }

  return lines.join('\n') + '\n';
}
