/**
 *
 * Copyright 2014-2025 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { promises as fsp } from 'node:fs';
import matter from 'gray-matter';
/**
 * Refactor tag names across all documents.
 * Changes all occurrences of oldTag to newTag in document frontmatter.
 *
 * @param config - The AkashaRender configuration
 * @param oldTag - The tag name to replace
 * @param newTag - The new tag name
 * @param options - Options including dryRun mode
 * @returns Result object with details of all changes made or that would be made
 */
export async function refactorTag(config, oldTag, newTag, options) {
    const result = {
        oldTag,
        newTag,
        dryRun: options.dryRun,
        modifiedDocuments: [],
        mergedDocuments: [],
        errors: []
    };
    // Get documents cache from the filecache
    const filecache = config.akasha.filecache;
    const documentsCache = filecache.documentsCache;
    // Find all documents with the old tag
    const vpaths = await documentsCache.documentsWithTag(oldTag);
    for (const vpath of vpaths) {
        try {
            // Get the document info to get the filesystem path
            const docInfo = await documentsCache.find(vpath);
            if (!docInfo || !docInfo.fspath) {
                result.errors.push({
                    vpath,
                    fspath: '',
                    error: `Could not find document info for ${vpath}`
                });
                continue;
            }
            const fspath = docInfo.fspath;
            // Read the file
            const content = await fsp.readFile(fspath, 'utf-8');
            // Parse frontmatter
            const parsed = matter(content);
            const originalTags = Array.isArray(parsed.data.tags)
                ? [...parsed.data.tags]
                : [];
            // Check if document already has the new tag
            const hasNewTag = originalTags.includes(newTag);
            const hasOldTag = originalTags.includes(oldTag);
            if (!hasOldTag) {
                // This shouldn't happen, but handle it gracefully
                continue;
            }
            // Compute new tags array
            let newTags;
            if (hasNewTag) {
                // Document already has new tag, just remove the old tag
                newTags = originalTags.filter(t => t !== oldTag);
            }
            else {
                // Replace old tag with new tag
                newTags = originalTags.map(t => t === oldTag ? newTag : t);
            }
            const change = {
                vpath,
                fspath,
                originalTags,
                newTags
            };
            if (hasNewTag) {
                result.mergedDocuments.push(change);
            }
            else {
                result.modifiedDocuments.push(change);
            }
            // If not dry run, write the file
            if (!options.dryRun) {
                parsed.data.tags = newTags;
                const newContent = matter.stringify(parsed.content, parsed.data);
                await fsp.writeFile(fspath, newContent, 'utf-8');
            }
        }
        catch (err) {
            result.errors.push({
                vpath,
                fspath: '',
                error: err instanceof Error ? err.message : String(err)
            });
        }
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmYWN0b3ItdGFncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9yZWZhY3Rvci10YWdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUVILE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sTUFBTSxNQUFNLGFBQWEsQ0FBQztBQWFqQzs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLFdBQVcsQ0FDN0IsTUFBcUIsRUFDckIsTUFBYyxFQUNkLE1BQWMsRUFDZCxPQUF3QjtJQUV4QixNQUFNLE1BQU0sR0FBc0I7UUFDOUIsTUFBTTtRQUNOLE1BQU07UUFDTixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFDdEIsaUJBQWlCLEVBQUUsRUFBRTtRQUNyQixlQUFlLEVBQUUsRUFBRTtRQUNuQixNQUFNLEVBQUUsRUFBRTtLQUNiLENBQUM7SUFFRix5Q0FBeUM7SUFDekMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDMUMsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUVoRCxzQ0FBc0M7SUFDdEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFN0QsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUM7WUFDRCxtREFBbUQ7WUFDbkQsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNmLEtBQUs7b0JBQ0wsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsS0FBSyxFQUFFLG9DQUFvQyxLQUFLLEVBQUU7aUJBQ3JELENBQUMsQ0FBQztnQkFDSCxTQUFTO1lBQ2IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsZ0JBQWdCO1lBQ2hCLE1BQU0sT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFcEQsb0JBQW9CO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNoRCxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUN2QixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRVQsNENBQTRDO1lBQzVDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVoRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2Isa0RBQWtEO2dCQUNsRCxTQUFTO1lBQ2IsQ0FBQztZQUVELHlCQUF5QjtZQUN6QixJQUFJLE9BQWlCLENBQUM7WUFDdEIsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDWix3REFBd0Q7Z0JBQ3hELE9BQU8sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELENBQUM7aUJBQU0sQ0FBQztnQkFDSiwrQkFBK0I7Z0JBQy9CLE9BQU8sR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQTJCO2dCQUNuQyxLQUFLO2dCQUNMLE1BQU07Z0JBQ04sWUFBWTtnQkFDWixPQUFPO2FBQ1YsQ0FBQztZQUVGLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7Z0JBQzNCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNmLEtBQUs7Z0JBQ0wsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLEdBQUcsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7YUFDMUQsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IG1hdHRlciBmcm9tICdncmF5LW1hdHRlcic7XG5cbmltcG9ydCB0eXBlIHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHR5cGUge1xuICAgIFJlZmFjdG9yVGFnUmVzdWx0LFxuICAgIFJlZmFjdG9yRG9jdW1lbnRDaGFuZ2UsXG4gICAgUmVmYWN0b3JFcnJvclxufSBmcm9tICcuL3R5cGVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBSZWZhY3Rvck9wdGlvbnMge1xuICAgIGRyeVJ1bjogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBSZWZhY3RvciB0YWcgbmFtZXMgYWNyb3NzIGFsbCBkb2N1bWVudHMuXG4gKiBDaGFuZ2VzIGFsbCBvY2N1cnJlbmNlcyBvZiBvbGRUYWcgdG8gbmV3VGFnIGluIGRvY3VtZW50IGZyb250bWF0dGVyLlxuICogXG4gKiBAcGFyYW0gY29uZmlnIC0gVGhlIEFrYXNoYVJlbmRlciBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gb2xkVGFnIC0gVGhlIHRhZyBuYW1lIHRvIHJlcGxhY2VcbiAqIEBwYXJhbSBuZXdUYWcgLSBUaGUgbmV3IHRhZyBuYW1lXG4gKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgaW5jbHVkaW5nIGRyeVJ1biBtb2RlXG4gKiBAcmV0dXJucyBSZXN1bHQgb2JqZWN0IHdpdGggZGV0YWlscyBvZiBhbGwgY2hhbmdlcyBtYWRlIG9yIHRoYXQgd291bGQgYmUgbWFkZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVmYWN0b3JUYWcoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIG9sZFRhZzogc3RyaW5nLFxuICAgIG5ld1RhZzogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFJlZmFjdG9yT3B0aW9uc1xuKTogUHJvbWlzZTxSZWZhY3RvclRhZ1Jlc3VsdD4ge1xuICAgIGNvbnN0IHJlc3VsdDogUmVmYWN0b3JUYWdSZXN1bHQgPSB7XG4gICAgICAgIG9sZFRhZyxcbiAgICAgICAgbmV3VGFnLFxuICAgICAgICBkcnlSdW46IG9wdGlvbnMuZHJ5UnVuLFxuICAgICAgICBtb2RpZmllZERvY3VtZW50czogW10sXG4gICAgICAgIG1lcmdlZERvY3VtZW50czogW10sXG4gICAgICAgIGVycm9yczogW11cbiAgICB9O1xuXG4gICAgLy8gR2V0IGRvY3VtZW50cyBjYWNoZSBmcm9tIHRoZSBmaWxlY2FjaGVcbiAgICBjb25zdCBmaWxlY2FjaGUgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZTtcbiAgICBjb25zdCBkb2N1bWVudHNDYWNoZSA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcblxuICAgIC8vIEZpbmQgYWxsIGRvY3VtZW50cyB3aXRoIHRoZSBvbGQgdGFnXG4gICAgY29uc3QgdnBhdGhzID0gYXdhaXQgZG9jdW1lbnRzQ2FjaGUuZG9jdW1lbnRzV2l0aFRhZyhvbGRUYWcpO1xuXG4gICAgZm9yIChjb25zdCB2cGF0aCBvZiB2cGF0aHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZG9jdW1lbnQgaW5mbyB0byBnZXQgdGhlIGZpbGVzeXN0ZW0gcGF0aFxuICAgICAgICAgICAgY29uc3QgZG9jSW5mbyA9IGF3YWl0IGRvY3VtZW50c0NhY2hlLmZpbmQodnBhdGgpO1xuICAgICAgICAgICAgaWYgKCFkb2NJbmZvIHx8ICFkb2NJbmZvLmZzcGF0aCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6ICcnLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYENvdWxkIG5vdCBmaW5kIGRvY3VtZW50IGluZm8gZm9yICR7dnBhdGh9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBkb2NJbmZvLmZzcGF0aDtcblxuICAgICAgICAgICAgLy8gUmVhZCB0aGUgZmlsZVxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmc3BhdGgsICd1dGYtOCcpO1xuXG4gICAgICAgICAgICAvLyBQYXJzZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gbWF0dGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxUYWdzID0gQXJyYXkuaXNBcnJheShwYXJzZWQuZGF0YS50YWdzKSBcbiAgICAgICAgICAgICAgICA/IFsuLi5wYXJzZWQuZGF0YS50YWdzXSBcbiAgICAgICAgICAgICAgICA6IFtdO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBkb2N1bWVudCBhbHJlYWR5IGhhcyB0aGUgbmV3IHRhZ1xuICAgICAgICAgICAgY29uc3QgaGFzTmV3VGFnID0gb3JpZ2luYWxUYWdzLmluY2x1ZGVzKG5ld1RhZyk7XG4gICAgICAgICAgICBjb25zdCBoYXNPbGRUYWcgPSBvcmlnaW5hbFRhZ3MuaW5jbHVkZXMob2xkVGFnKTtcblxuICAgICAgICAgICAgaWYgKCFoYXNPbGRUYWcpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHNob3VsZG4ndCBoYXBwZW4sIGJ1dCBoYW5kbGUgaXQgZ3JhY2VmdWxseVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb21wdXRlIG5ldyB0YWdzIGFycmF5XG4gICAgICAgICAgICBsZXQgbmV3VGFnczogc3RyaW5nW107XG4gICAgICAgICAgICBpZiAoaGFzTmV3VGFnKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9jdW1lbnQgYWxyZWFkeSBoYXMgbmV3IHRhZywganVzdCByZW1vdmUgdGhlIG9sZCB0YWdcbiAgICAgICAgICAgICAgICBuZXdUYWdzID0gb3JpZ2luYWxUYWdzLmZpbHRlcih0ID0+IHQgIT09IG9sZFRhZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFJlcGxhY2Ugb2xkIHRhZyB3aXRoIG5ldyB0YWdcbiAgICAgICAgICAgICAgICBuZXdUYWdzID0gb3JpZ2luYWxUYWdzLm1hcCh0ID0+IHQgPT09IG9sZFRhZyA/IG5ld1RhZyA6IHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGFuZ2U6IFJlZmFjdG9yRG9jdW1lbnRDaGFuZ2UgPSB7XG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZnNwYXRoLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsVGFncyxcbiAgICAgICAgICAgICAgICBuZXdUYWdzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoaGFzTmV3VGFnKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm1lcmdlZERvY3VtZW50cy5wdXNoKGNoYW5nZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5tb2RpZmllZERvY3VtZW50cy5wdXNoKGNoYW5nZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIG5vdCBkcnkgcnVuLCB3cml0ZSB0aGUgZmlsZVxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmRyeVJ1bikge1xuICAgICAgICAgICAgICAgIHBhcnNlZC5kYXRhLnRhZ3MgPSBuZXdUYWdzO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NvbnRlbnQgPSBtYXR0ZXIuc3RyaW5naWZ5KHBhcnNlZC5jb250ZW50LCBwYXJzZWQuZGF0YSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShmc3BhdGgsIG5ld0NvbnRlbnQsICd1dGYtOCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZnNwYXRoOiAnJyxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG4iXX0=