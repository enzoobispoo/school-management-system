import { tags } from "@trigger.dev/sdk/v3";

/** Observabilidade multi-tenant no Trigger.dev (filtros no dashboard). */
export async function addSchoolTenantTags(schoolId: string, tenantId: string) {
  if (schoolId !== tenantId) {
    throw new Error("tenantId deve ser igual a schoolId.");
  }
  await tags.add([`school:${schoolId}`, `tenant:${tenantId}`]);
}
