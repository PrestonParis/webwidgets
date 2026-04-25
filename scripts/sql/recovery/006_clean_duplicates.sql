DELETE FROM dashboard_layouts a
USING dashboard_layouts b
WHERE a.id < b.id 
    AND a.user_id = b.user_id;