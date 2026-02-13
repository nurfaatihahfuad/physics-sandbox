document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('physics-canvas');
    const physics = new PhysicsEngine(canvas);
    
    // UI Elements
    const spawnBoxBtn = document.getElementById('spawn-box');
    const spawnBallBtn = document.getElementById('spawn-ball');
    const spawnPolygonBtn = document.getElementById('spawn-polygon');
    const gravityToggle = document.getElementById('gravity-toggle');
    const playPauseBtn = document.getElementById('play-pause');
    const clearAllBtn = document.getElementById('clear-all');
    const windToggle = document.getElementById('wind-toggle');
    const explosionBtn = document.getElementById('explosion');
    const frictionSlider = document.getElementById('friction-slider');
    const objectCount = document.getElementById('object-count');
    const fpsCounter = document.getElementById('fps-counter');
    
    let currentMode = 'spawn'; // 'spawn', 'delete'
    let spawnType = 'box';
    
    // Add delete mode indicator
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'd' || e.key === 'D') {
            currentMode = 'delete';
            document.body.classList.add('delete-mode');
        }
    });
    
    document.body.addEventListener('keyup', (e) => {
        if (e.key === 'Delete' || e.key === 'd' || e.key === 'D') {
            currentMode = 'spawn';
            document.body.classList.remove('delete-mode');
        }
    });
    
    // Spawn buttons
    spawnBoxBtn.addEventListener('click', () => {
        spawnType = 'box';
        currentMode = 'spawn';
        document.body.classList.remove('delete-mode');
    });
    
    spawnBallBtn.addEventListener('click', () => {
        spawnType = 'ball';
        currentMode = 'spawn';
        document.body.classList.remove('delete-mode');
    });
    
    spawnPolygonBtn.addEventListener('click', () => {
        spawnType = 'polygon';
        currentMode = 'spawn';
        document.body.classList.remove('delete-mode');
    });
    
    // Canvas click handler for spawning/deleting
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        if (currentMode === 'spawn') {
            physics.spawnObject(x, y, spawnType);
        } else if (currentMode === 'delete') {
            physics.deleteObject(x, y);
        }
    });
    
    // Control buttons
    gravityToggle.addEventListener('click', () => {
        physics.toggleGravity();
        gravityToggle.textContent = physics.gravity ? '🌍 Gravity: ON' : '🌍 Gravity: OFF';
        gravityToggle.classList.toggle('active', physics.gravity);
    });
    
    playPauseBtn.addEventListener('click', () => {
        physics.toggleSimulation();
        playPauseBtn.textContent = physics.simulating ? '⏸️ Pause' : '▶️ Play';
    });
    
    clearAllBtn.addEventListener('click', () => {
        physics.clearAll();
    });
    
    windToggle.addEventListener('click', () => {
        physics.toggleWind();
        windToggle.textContent = physics.wind ? '💨 Wind: ON' : '💨 Wind: OFF';
        windToggle.classList.toggle('active', physics.wind);
    });
    
    explosionBtn.addEventListener('click', () => {
        // Create explosion at center of canvas
        physics.createExplosion(canvas.width / 2, canvas.height / 2);
    });
    
    frictionSlider.addEventListener('input', (e) => {
        physics.setFriction(parseFloat(e.target.value));
    });
    
    // Double-click to delete
    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        physics.deleteObject(x, y);
    });
    
    // Animation loop
    function animate() {
        physics.update();
        physics.draw();
        
        // Update UI
        objectCount.textContent = `Objects: ${physics.objects.length}`;
        fpsCounter.textContent = `FPS: ${physics.fps}`;
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Spawn some initial objects
    physics.spawnObject(200, 200, 'box');
    physics.spawnObject(400, 300, 'ball');
    physics.spawnObject(600, 250, 'polygon');
});
