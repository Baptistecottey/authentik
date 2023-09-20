import { DEFAULT_CONFIG } from "@goauthentik/app/common/api/config";
import { PaginatedResponse, Table, TableColumn } from "@goauthentik/app/elements/table/Table";
import "@patternfly/elements/pf-tooltip/pf-tooltip.js";

import { msg } from "@lit/localize";
import { TemplateResult, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
    CoreApi,
    CoreRbacUserListModelEnum,
    PaginatedPermissionList,
    RoleAssignedObjectPermission,
} from "@goauthentik/api";

@customElement("ak-rbac-role-object-permission-table")
export class RoleAssignedObjectPermissionTable extends Table<RoleAssignedObjectPermission> {
    @property()
    model?: CoreRbacUserListModelEnum;

    @property()
    objectPk?: string | number;

    @state()
    modelPermissions?: PaginatedPermissionList;

    async apiEndpoint(page: number): Promise<PaginatedResponse<RoleAssignedObjectPermission>> {
        const perms = await new CoreApi(DEFAULT_CONFIG).coreRbacRoleList({
            page: page,
            // TODO: better default
            model: this.model || CoreRbacUserListModelEnum.CoreUser,
            objectPk: this.objectPk?.toString(),
        });
        const [appLabel, modelName] = (this.model || "").split(".");
        this.modelPermissions = await new CoreApi(DEFAULT_CONFIG).coreRbacPermissionsList({
            contentTypeModel: modelName,
            contentTypeAppLabel: appLabel,
            ordering: "codename",
        });
        return perms;
    }

    columns(): TableColumn[] {
        const baseColumns = [new TableColumn("User", "user")];
        // We don't check pagination since models shouldn't need to have that many permissions?
        this.modelPermissions?.results.forEach((perm) => {
            baseColumns.push(new TableColumn(perm.name, perm.codename));
        });
        return baseColumns;
    }

    row(item: RoleAssignedObjectPermission): TemplateResult[] {
        const baseRow = [html` <a href="#/identity/users/"> ${item.name} </a> `];
        this.modelPermissions?.results.forEach((perm) => {
            let cell = html`X`;
            if (item.permissions.filter((uperm) => uperm.codename === perm.codename).length > 0) {
                cell = html`<pf-tooltip position="top" content=${msg("Directly assigned")}
                    >✓</pf-tooltip
                >`;
            } else if (item.isSuperuser) {
                cell = html`<pf-tooltip position="top" content=${msg("Superuser")}>✓</pf-tooltip>`;
            }
            baseRow.push(cell);
        });
        return baseRow;
    }
}