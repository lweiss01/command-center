import fs from 'fs';
import path from 'path';

// POINT THIS TO YOUR DEV ROOT
const PROJECTS_DIR = 'C:/Users/lweis/Documents'; 

function scanProjects(dir) {
    const folders = fs.readdirSync(dir);
    const discovered = [];

    folders.forEach(folder => {
        const fullPath = path.join(dir, folder);
        
        // Skip hidden folders and node_modules
        if (folder.startsWith('.') || folder === 'node_modules') return;

        try {
            if (fs.statSync(fullPath).isDirectory()) {
                const files = fs.readdirSync(fullPath);
                
                // Detection Logic
                const isProject = files.some(f => 
                    ['package.json', '.git', 'requirements.txt', 'manifest.json'].includes(f)
                );

                if (isProject) {
                    discovered.push({
                        name: folder,
                        path: fullPath,
                        type: files.includes('package.json') ? 'Web/Node' : 'General'
                    });
                }
            }
        } catch (e) { /* skip restricted folders */ }
    });

    return discovered;
}

const myProjects = scanProjects(PROJECTS_DIR);
console.log("--- DISCOVERED PROJECTS ---");
myProjects.forEach(p => console.log(`[${p.type}] ${p.name}`));

// For now, we'll just save this to a local JSON file that our app can read
fs.writeFileSync('./src/projects-seed.json', JSON.stringify(myProjects, null, 2));
console.log(`\nSuccess! Saved ${myProjects.length} projects to src/projects-seed.json`);