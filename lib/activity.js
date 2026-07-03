async function logActivity(sql, entityType, entityId, action, detail) {
  await sql`
    INSERT INTO activity_log (entity_type, entity_id, action, detail)
    VALUES (${entityType}, ${entityId}, ${action}, ${detail || null})
  `;
}

module.exports = { logActivity };
