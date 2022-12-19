// based https://github.com/chooin/react-native-hook/blob/master/src/hooks/usePermissions.ts
import { Platform } from 'react-native';
import {
  checkMultiple,
  requestMultiple,
  Permission,
  PermissionStatus,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

type PermissionsResult = [
  status: () => Promise<boolean>,
  request: () => PermissionsRequestResult,
  openSettings: () => Promise<void>,
];

/**
 * Check whether multiple permissions are open or request multiple permissions
 * @param permissions - Permission[]  Permission List
 * @param permissionStatus - RESULTS  default RESULTS.GRANTED
 * @returns [status:Promise<boolean> , request:PermissionsRequestResult , openSettings:Promise<void> ]
 * @public
 */
export function usePermissions(
  permissions: Permission[],
  permissionStatus: PermissionStatus = RESULTS.GRANTED,
): PermissionsResult {
  permissions = permissions.filter(item => item?.includes(`${Platform.OS}.`));

  const status = async () => {
    try {
      let statuses = await checkMultiple(permissions);
      return permissions.every(
        permission => statuses[permission] === permissionStatus,
      );
    } catch (error) {
      return false;
    }
  };

  const request = (): PermissionsRequestResult => {
    return new Promise((resolve, reject) => {
      requestMultiple(permissions).then(statuses => {
        if (
          permissions.every(
            permission => statuses[permission] === RESULTS.GRANTED,
          )
        ) {
          resolve();
        } else {
          reject();
        }
      });
    });
  };

  return [status, request, openSettings];
}

export type PermissionsRequestResult = Promise<void | {
  openSettings: () => Promise<void>;
}>;

/**
 * Apply to the system for permission that has not been opened
 * @param permissions - Permission[]  Permission List
 * @param permissionStatus - RESULTS  default RESULTS.GRANTED
 * @public
 */
export function requestPermissions(
  permissions: Permission[],
  permissionStatus: PermissionStatus = RESULTS.GRANTED,
): PermissionsRequestResult {
  return new Promise((resolve, reject) => {
    permissions.filter((item: string) => item?.includes(`${Platform.OS}.`));
    checkMultiple(permissions).then(checkMultipleStates => {
      permissions = permissions.filter(
        permission =>
          checkMultipleStates[permission] !== permissionStatus && permission,
      );
      if (permissions.length === 0) {
        resolve();
      } else {
        requestMultiple(permissions).then(requestMultipleStates => {
          permissions = permissions.filter(
            permission =>
              requestMultipleStates[permission] !== permissionStatus &&
              permission,
          );
          if (permissions.length === 0) {
            resolve();
          } else {
            reject({
              openSettings,
            });
          }
        });
      }
    });
  });
}
