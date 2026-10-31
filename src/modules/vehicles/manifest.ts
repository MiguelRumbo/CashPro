import type { ModuleManifest } from '@/core/contracts/module';

import { disposeVehiclesRuntime, getVehiclesRuntime, initVehiclesRuntime } from './runtime';
import { vehiclesTexts } from './texts';
import { AddVehicleScreen } from './ui/add-vehicle-screen';
import { EditVehicleScreen } from './ui/edit-vehicle-screen';
import { VehicleDetailScreen } from './ui/vehicle-detail-screen';
import { VehiclesListScreen } from './ui/vehicles-list-screen';

export const manifest: ModuleManifest = {
  id: 'vehicles',
  version: '1.0.0',
  routes: ['/vehicles', '/vehicles/add-vehicle', '/vehicles/edit-vehicle', '/vehicles/vehicle-detail'],
  screens: {
    'vehicles.list': VehiclesListScreen,
    'vehicles.add': AddVehicleScreen,
    'vehicles.edit': EditVehicleScreen,
    'vehicles.detail': VehicleDetailScreen,
  },
  actions: [
    {
      id: 'vehicles.menu',
      slot: 'more.menu',
      title: vehiclesTexts.menuTitle,
      subtitle: vehiclesTexts.menuSubtitle,
      icon: 'car',
      color: '#3b82f6',
      iconBg: 'rgba(59,130,246,0.16)',
      route: '/vehicles',
      order: 5,
    },
  ],
  dataPort: () => getVehiclesRuntime().dataPort,
  register: initVehiclesRuntime,
  dispose: disposeVehiclesRuntime,
};
