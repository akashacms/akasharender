SELECT DISTINCT tg.tagName, tg.docvpath
FROM TAGGLUE tg
LEFT JOIN TAGDESCRIPTION td ON tg.tagName = td.tagName
WHERE td.tagName IS NULL
ORDER BY tg.tagName, tg.docvpath;
