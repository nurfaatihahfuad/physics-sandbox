class PhysicsObject {
    constructor(x, y, type, options = {}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; // 'box', 'ball', 'polygon'
        this.x = x;
        this.y = y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.rotation = options.rotation || 0;
        this.angularVelocity = 0;
        
        // Physical properties
        this.mass = options.mass || 1;
        this.restitution = options.restitution || 0.7; // Bounciness
        this.friction = options.friction || 0.3;
        
        // Size based on type
        if (type === 'box') {
            this.width = options.width || 40;
            this.height = options.height || 40;
        } else if (type === 'ball') {
            this.radius = options.radius || 20;
        } else if (type === 'polygon') {
            this.points = options.points || this.generateRandomPolygon();
            this.calculatePolygonBounds();
        }
        
        // Color
        this.color = this.generateColor();
        
        // For mouse interaction
        this.isDragged = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    }
    
    generateColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateRandomPolygon() {
        const numPoints = 5 + Math.floor(Math.random() * 4); // 5-8 points
        const centerX = 0;
        const centerY = 0;
        const radius = 25;
        const points = [];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.6); // Vary radius
            points.push({
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r
            });
        }
        return points;
    }
    
    calculatePolygonBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        
        this.width = maxX - minX;
        this.height = maxY - minY;
    }
    
    applyForce(forceX, forceY) {
        this.vx += forceX / this.mass;
        this.vy += forceY / this.mass;
    }
    
    applyExplosion(centerX, centerY, force) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        const explosionForce = force * (1 - Math.min(distance / 200, 1));
        this.vx += directionX * explosionForce / this.mass;
        this.vy += directionY * explosionForce / this.mass;
    }
    
    applyWind(windX, windY) {
        // Wind affects objects based on their surface area
        let area = 1;
        if (this.type === 'box') area = this.width * this.height / 1000;
        else if (this.type === 'ball') area = Math.PI * this.radius * this.radius / 1000;
        else area = this.width * this.height / 1000;
        
        this.vx += windX * area;
        this.vy += windY * area;
    }
    
    update(gravity, deltaTime, friction) {
        if (this.isDragged) return;
        
        // Apply gravity
        if (gravity) {
            this.vy += 0.5 * deltaTime;
        }
        
        // Apply friction (air resistance)
        this.vx *= (1 - friction * deltaTime * 0.1);
        this.vy *= (1 - friction * deltaTime * 0.1);
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update rotation
        this.rotation += this.angularVelocity * deltaTime;
    }
    
    checkCollision(other) {
        // Simple collision detection (can be improved)
        if (this.type === 'ball' && other.type === 'ball') {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (this.radius + other.radius);
        } else if (this.type === 'box' && other.type === 'box') {
            return !(this.x + this.width/2 < other.x - other.width/2 ||
                    this.x - this.width/2 > other.x + other.width/2 ||
                    this.y + this.height/2 < other.y - other.height/2 ||
                    this.y - this.height/2 > other.y + other.height/2);
        }
        return false;
    }
    
    resolveCollision(other) {
        // Simple collision response
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const vRelX = this.vx - other.vx;
        const vRelY = this.vy - other.vy;
        const velAlong = vRelX * nx + vRelY * ny;
        
        if (velAlong > 0) return;
        
        const e = Math.min(this.restitution, other.restitution);
        const impulse = -(1 + e) * velAlong / (1/this.mass + 1/other.mass);
        
        this.vx += impulse * nx / this.mass;
        this.vy += impulse * ny / this.mass;
        other.vx -= impulse * nx / other.mass;
        other.vy -= impulse * ny / other.mass;
        
        // Position correction to prevent sticking
        const percent = 0.2;
        const slop = 0.1;
        const correction = Math.max(distance - (this.radius + other.radius + slop), 0) / (1/this.mass + 1/other.mass) * percent;
        
        if (distance > 0) {
            this.x += nx * correction / this.mass;
            this.y += ny * correction / this.mass;
            other.x -= nx * correction / other.mass;
            other.y -= ny * correction / other.mass;
        }
    }
    
    checkBoundaryCollision(canvasWidth, canvasHeight) {
        let collided = false;
        
        if (this.type === 'ball') {
            // Ball boundary collisions
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx = -this.vx * this.restitution;
                collided = true;
            }
            if (this.x + this.radius > canvasWidth) {
                this.x = canvasWidth - this.radius;
                this.vx = -this.vx * this.restitution;
                collided = true;
            }
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy = -this.vy * this.restitution;
                collided = true;
            }
            if (this.y + this.radius > canvasHeight) {
                this.y = canvasHeight - this.radius;
                this.vy = -this.vy * this.restitution;
                collided = true;
            }
        } else {
            // Box and polygon boundary collisions
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            
            if (this.x - halfWidth < 0) {
                this.x = halfWidth;
                this.vx = -this.vx * this.restitution;
                collided = true;
            }
            if (this.x + halfWidth > canvasWidth) {
                this.x = canvasWidth - halfWidth;
                this.vx = -this.vx * this.restitution;
                collided = true;
            }
            if (this.y - halfHeight < 0) {
                this.y = halfHeight;
                this.vy = -this.vy * this.restitution;
                collided = true;
            }
            if (this.y + halfHeight > canvasHeight) {
                this.y = canvasHeight - halfHeight;
                this.vy = -this.vy * this.restitution;
                collided = true;
            }
        }
        
        return collided;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        if (this.type === 'box') {
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        } else if (this.type === 'ball') {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'polygon') {
            ctx.beginPath();
            this.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.objects = [];
        this.gravity = true;
        this.wind = false;
        this.simulating = true;
        this.friction = 0.3;
        this.lastTime = 0;
        this.fps = 60;
        this.windForce = { x: 0.1, y: 0 };
        
        // Mouse interaction
        this.isDragging = false;
        this.selectedObject = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
        
        // Check if we're clicking on an object
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (obj.type === 'ball') {
                const dx = this.mouseX - obj.x;
                const dy = this.mouseY - obj.y;
                if (Math.sqrt(dx*dx + dy*dy) < obj.radius) {
                    this.isDragging = true;
                    this.selectedObject = obj;
                    obj.isDragged = true;
                    obj.dragOffsetX = this.mouseX - obj.x;
                    obj.dragOffsetY = this.mouseY - obj.y;
                    break;
                }
            } else {
                const halfWidth = obj.width / 2;
                const halfHeight = obj.height / 2;
                if (this.mouseX >= obj.x - halfWidth && this.mouseX <= obj.x + halfWidth &&
                    this.mouseY >= obj.y - halfHeight && this.mouseY <= obj.y + halfHeight) {
                    this.isDragging = true;
                    this.selectedObject = obj;
                    obj.isDragged = true;
                    obj.dragOffsetX = this.mouseX - obj.x;
                    obj.dragOffsetY = this.mouseY - obj.y;
                    break;
                }
            }
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedObject) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
        
        this.selectedObject.x = this.mouseX - this.selectedObject.dragOffsetX;
        this.selectedObject.y = this.mouseY - this.selectedObject.dragOffsetY;
        this.selectedObject.vx = 0;
        this.selectedObject.vy = 0;
    }
    
    handleMouseUp() {
        if (this.selectedObject) {
            this.selectedObject.isDragged = false;
        }
        this.isDragging = false;
        this.selectedObject = null;
    }
    
    spawnObject(x, y, type) {
        const obj = new PhysicsObject(x, y, type, {
            friction: this.friction
        });
        this.objects.push(obj);
        return obj;
    }
    
    deleteObject(x, y) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            if (obj.type === 'ball') {
                const dx = x - obj.x;
                const dy = y - obj.y;
                if (Math.sqrt(dx*dx + dy*dy) < obj.radius) {
                    this.objects.splice(i, 1);
                    return true;
                }
            } else {
                const halfWidth = obj.width / 2;
                const halfHeight = obj.height / 2;
                if (x >= obj.x - halfWidth && x <= obj.x + halfWidth &&
                    y >= obj.y - halfHeight && y <= obj.y + halfHeight) {
                    this.objects.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }
    
    clearAll() {
        this.objects = [];
    }
    
    createExplosion(x, y) {
        const force = 5;
        this.objects.forEach(obj => {
            obj.applyExplosion(x, y, force);
        });
    }
    
    update() {
        if (!this.simulating) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 16, 2); // Cap at 2x
        this.lastTime = currentTime;
        
        // Apply wind
        if (this.wind) {
            this.objects.forEach(obj => {
                obj.applyWind(this.windForce.x, this.windForce.y);
            });
        }
        
        // Update all objects
        this.objects.forEach(obj => {
            obj.update(this.gravity, deltaTime, this.friction);
        });
        
        // Check boundary collisions
        this.objects.forEach(obj => {
            obj.checkBoundaryCollision(this.canvas.width, this.canvas.height);
        });
        
        // Check object collisions
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                if (this.objects[i].checkCollision(this.objects[j])) {
                    this.objects[i].resolveCollision(this.objects[j]);
                }
            }
        }
        
        // Update FPS
        this.fps = Math.floor(1000 / deltaTime);
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (optional)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Draw objects
        this.objects.forEach(obj => {
            obj.draw(this.ctx);
        });
        
        // Draw wind indicator
        if (this.wind) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('💨 Wind Active', 10, 30);
        }
    }
    
    toggleGravity() {
        this.gravity = !this.gravity;
    }
    
    toggleWind() {
        this.wind = !this.wind;
    }
    
    toggleSimulation() {
        this.simulating = !this.simulating;
    }
    
    setFriction(value) {
        this.friction = value;
        this.objects.forEach(obj => {
            obj.friction = value;
        });
    }
  }
