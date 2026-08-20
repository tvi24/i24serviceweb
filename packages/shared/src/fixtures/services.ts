import type { Service } from '../types.js';

// Synthetic service catalog (configurable at runtime).
export const services: Service[] = [
  { id: 'svc-m365', name: 'Microsoft 365', ownerBuId: 'bu-mgc', active: true },
  { id: 'svc-rental', name: 'Rental Platform', ownerBuId: 'bu-mcr', active: true },
  { id: 'svc-dealer', name: 'Dealer System', ownerBuId: 'bu-xpeng', active: true },
  { id: 'svc-network', name: 'Network', ownerBuId: 'bu-mag', active: true },
  { id: 'svc-erp', name: 'ERP', ownerBuId: 'bu-mgc', active: true },
];
