/*
 * Verified fallback captured from the named public feeds at snapshotAt.
 * This is real source data, not generated demo telemetry. The live client
 * replaces it whenever /api/threat-intel or the providers are reachable.
 */
window.__THREAT_SNAPSHOT__ = {
  snapshotAt: '2026-07-20T11:11:10Z',
  mode: 'verified-snapshot',
  dshield: {
    source: 'SANS Internet Storm Center / DShield',
    sourceUrl: 'https://feeds.dshield.org/feeds/block.txt',
    updatedAt: '2026-07-20T11:00:37.478685Z',
    window: 'Top attacking /24 networks observed over the previous three days',
    records: [
      { start: '45.198.224.0', end: '45.198.224.255', cidr: 24, targets: 344, network: 'OWS', country: 'US' },
      { start: '45.194.67.0', end: '45.194.67.255', cidr: 24, targets: 340, network: 'Africa-on-Cloud-AS', country: 'ZA' },
      { start: '94.154.43.0', end: '94.154.43.255', cidr: 24, targets: 339, network: 'EKSENBILISIM', country: 'TR' },
      { start: '64.62.197.0', end: '64.62.197.255', cidr: 24, targets: 338, network: 'HURRICANE', country: 'US' },
      { start: '66.132.172.0', end: '66.132.172.255', cidr: 24, targets: 337, network: 'UNATTRIBUTED', country: null },
      { start: '66.132.186.0', end: '66.132.186.255', cidr: 24, targets: 336, network: 'UNATTRIBUTED', country: null },
      { start: '147.185.132.0', end: '147.185.132.255', cidr: 24, targets: 334, network: 'GOOGLE-CLOUD-PLATFORM', country: 'US' },
      { start: '199.45.154.0', end: '199.45.154.255', cidr: 24, targets: 334, network: 'CENSYS-ARIN-03', country: 'US' },
      { start: '77.90.185.0', end: '77.90.185.255', cidr: 24, targets: 330, network: 'BTHOSTER', country: 'GB' },
      { start: '45.205.1.0', end: '45.205.1.255', cidr: 24, targets: 329, network: 'MULTA-ASN1', country: 'US' },
      { start: '66.132.195.0', end: '66.132.195.255', cidr: 24, targets: 329, network: 'UNATTRIBUTED', country: null },
      { start: '195.178.110.0', end: '195.178.110.255', cidr: 24, targets: 329, network: 'DATAFOREST', country: 'DE' },
      { start: '5.61.209.0', end: '5.61.209.255', cidr: 24, targets: 328, network: 'ASN-TCABLE', country: 'ES' },
      { start: '193.163.125.0', end: '193.163.125.255', cidr: 24, targets: 327, network: 'INTERNET-MEASUREMENT', country: 'GB' },
      { start: '45.148.10.0', end: '45.148.10.255', cidr: 24, targets: 326, network: 'PPTECHNOLOGY', country: 'GB' },
      { start: '66.132.224.0', end: '66.132.224.255', cidr: 24, targets: 326, network: 'UNATTRIBUTED', country: null },
      { start: '65.49.1.0', end: '65.49.1.255', cidr: 24, targets: 325, network: 'HURRICANE', country: 'US' },
      { start: '64.62.156.0', end: '64.62.156.255', cidr: 24, targets: 324, network: 'HURRICANE', country: 'US' },
      { start: '151.243.11.0', end: '151.243.11.255', cidr: 24, targets: 324, network: 'RASANA', country: 'IR' },
      { start: '43.228.157.0', end: '43.228.157.255', cidr: 24, targets: 323, network: 'M247', country: 'RO' }
    ]
  },
  feodo: {
    source: 'abuse.ch Feodo Tracker',
    sourceUrl: 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json',
    retrievedAt: '2026-07-20T11:11:10Z',
    records: [
      { ip_address: '50.16.16.211', port: 443, status: 'online', hostname: 'ec2-50-16-16-211.compute-1.amazonaws.com', as_number: 14618, as_name: 'AMAZON-AES', country: 'US', first_seen: '2025-12-30 13:56:31', last_online: '2026-03-12', malware: 'QakBot' }
    ]
  }
};
