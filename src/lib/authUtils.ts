import { Role } from './auth';

export const computeAccessiblePortals = (baseRole: Role | string, hasClasses: boolean): string[] => {
  const portals: string[] = [];

  if (baseRole === 'CEO') {
    return ['CEO', 'Manager', 'Teacher', 'Sales/HR', 'DM', 'Student'];
  }

  portals.push(baseRole);

  if (hasClasses && baseRole !== 'Teacher') {
    portals.push('Teacher');
  }

  return portals;
};
