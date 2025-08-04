// Simple test to verify canvas rendering
document.addEventListener('DOMContentLoaded', function() {
    const sideCanvas = document.getElementById('sideCanvas');
    const topCanvas = document.getElementById('topCanvas');
    
    if (!sideCanvas || !topCanvas) {
        console.error('Canvas elements not found');
        return;
    }
    
    const sideCtx = sideCanvas.getContext('2d');
    const topCtx = topCanvas.getContext('2d');
    
    function resizeCanvases() {
        const sideContainer = document.getElementById('sideViewContainer');
        const topContainer = document.getElementById('topViewContainer');
        
        if (sideContainer) {
            const rect = sideContainer.getBoundingClientRect();
            sideCanvas.width = rect.width;
            sideCanvas.height = rect.height;
        }
        
        if (topContainer) {
            const topRect = topContainer.getBoundingClientRect();
            topCanvas.width = topRect.width;
            topCanvas.height = topRect.height;
        }
        
        render();
    }
    
    function render() {
        // Clear canvases
        sideCtx.clearRect(0, 0, sideCanvas.width, sideCanvas.height);
        topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
        
        // Draw grid
        drawGrid(sideCtx, sideCanvas.width, sideCanvas.height);
        drawGrid(topCtx, topCanvas.width, topCanvas.height);
        
        // Draw simple engine representation
        drawSimpleEngine(sideCtx, topCtx);
    }
    
    function drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }
    
    function drawSimpleEngine(sideCtx, topCtx) {
        const centerX = sideCanvas.width / 2;
        const centerY = sideCanvas.height / 2;
        
        // Side view - simple engine block
        sideCtx.fillStyle = '#666';
        sideCtx.fillRect(centerX - 150, centerY - 50, 300, 100);
        
        sideCtx.fillStyle = '#fff';
        sideCtx.font = '16px Arial';
        sideCtx.fillText('Side View - Engine Block', centerX - 80, centerY);
        
        // Top view
        const topCenterX = topCanvas.width / 2;
        const topCenterY = topCanvas.height / 2;
        
        topCtx.fillStyle = '#666';
        topCtx.fillRect(topCenterX - 150, topCenterY - 30, 300, 60);
        
        // Draw cylinders
        for (let i = 0; i < 4; i++) {
            const x = topCenterX - 120 + i * 80;
            topCtx.fillStyle = '#888';
            topCtx.beginPath();
            topCtx.arc(x, topCenterY, 20, 0, Math.PI * 2);
            topCtx.fill();
            
            topCtx.fillStyle = '#fff';
            topCtx.font = '12px Arial';
            topCtx.fillText((i + 1).toString(), x - 3, topCenterY + 3);
        }
        
        topCtx.fillStyle = '#fff';
        topCtx.font = '16px Arial';
        topCtx.fillText('Top View - 4 Cylinders', topCenterX - 70, topCenterY + 50);
    }
    
    // Initial render
    setTimeout(resizeCanvases, 100);
    
    // Resize handler
    window.addEventListener('resize', resizeCanvases);
});