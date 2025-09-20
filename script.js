const imageUpload = document.getElementById('image-upload');
const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');
const messageEl = document.getElementById('message');
const slapSound = document.getElementById('slap-sound');

let faceImage = new Image();
let faceLoaded = false;
let slapEffectActive = false;
let particles = []; // Partikülleri tutacak dizi

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            faceImage.src = event.target.result;
            faceImage.onload = () => {
                // Canvas boyutunu, fotoğrafın ekran boyutuna sığacak şekilde ayarla
                const containerWidth = gameCanvas.parentElement.clientWidth;
                const ratio = faceImage.width / faceImage.height;

                // Canvas'ı konteynerin genişliğine sabitle
                gameCanvas.width = containerWidth;
                gameCanvas.height = containerWidth / ratio;

                // Fotoğrafı canvas'a çiz
                ctx.drawImage(faceImage, 0, 0, gameCanvas.width, gameCanvas.height);
                faceLoaded = true;
                messageEl.textContent = 'Şimdi tokat atmak için fotoğrafa dokunun!';
            };
        };
        reader.readAsDataURL(file);
    }
});


gameCanvas.addEventListener('click', (e) => {
    if (!faceLoaded || slapEffectActive) {
        if (!faceLoaded) {
            messageEl.textContent = 'Lütfen önce bir fotoğraf yükleyin!';
        }
        return;
    }
    
    slapSound.currentTime = 0;
    slapSound.play();

    const rect = gameCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Kan partikülleri oluştur
    createBloodParticles(x, y); // Yeni fonksiyona geçtik

    activateSlapEffect(x, y);

    messageEl.textContent = 'Tokat Atıldı!';
});

// Kan partikülü oluşturma fonksiyonu
function createBloodParticles(x, y) {
    particles = []; // Her tokatta önceki partikülleri temizle
    const numParticles = 30; // Oluşturulacak partikül sayısı (kan için biraz daha fazla)
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 8 + 3; // Kan için biraz daha hızlı ve uzağa sıçrasın
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: Math.random() * 4 + 2, // Kan damlaları için biraz daha büyük
            alpha: 1,
            // Kırmızı ve bordo tonlarında renkler
            color: `rgba(${Math.floor(Math.random() * 50 + 150)}, 0, 0, 1)` 
                 // Kırmızı tonları (150-200 arası)
        });
    }
}

// Tokat efekti ve emoji animasyonu
function activateSlapEffect(x, y) {
    slapEffectActive = true;

    let emojiSize = 40;
    const maxEmojiSize = 100;
    const animationDuration = 250;
    const startTime = performance.now();

    const animateSlap = () => {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Titreme efekti için resmi kaydırarak çiz
        ctx.drawImage(faceImage, 
                      Math.random() * 5 - 2.5,
                      Math.random() * 5 - 2.5,
                      gameCanvas.width, 
                      gameCanvas.height);

        // Darbe efekti (karartma)
        const gradientRadius = 50; 
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, gradientRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, gradientRadius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();

        // El emojisi animasyonu
        emojiSize = 40 + (maxEmojiSize - 40) * progress;
        let emojiOpacity = 1 - progress;

        ctx.font = `${emojiSize}px Arial`;
        ctx.globalAlpha = emojiOpacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖐️', x, y);

        // İkinci, daha küçük bir dalga (opsiyonel, emoji olarak)
        if (progress > 0.3) {
            let innerEmojiSize = (maxEmojiSize * (progress - 0.3)) * 0.8;
            let innerEmojiOpacity = 1 - (progress - 0.3) / 0.7;
            if (innerEmojiOpacity > 0) {
                ctx.globalAlpha = innerEmojiOpacity;
                ctx.font = `${innerEmojiSize}px Arial`;
                ctx.fillText('🖐️', x, y);
            }
        }
        
        // Partikülleri güncelle ve çiz (Kan efekti)
        ctx.globalAlpha = 1; 
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Kan damlaları biraz daha belirgin yer çekimi etkisiyle düşsün
            p.alpha -= 0.03; // Daha yavaş şeffaflaşsın, daha uzun kalsın
            p.size *= 0.95; // Zamanla küçülsün

            if (p.alpha <= 0.05 || p.size <= 0.5) {
                particles.splice(i, 1); 
            } else {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.globalAlpha = 1; // Şeffaflık ayarını sıfırla

        if (progress < 1 || particles.length > 0) {
            requestAnimationFrame(animateSlap);
        } else {
            deactivateSlapEffect();
        }
    };

    requestAnimationFrame(animateSlap);
}

function deactivateSlapEffect() {
    slapEffectActive = false;
    particles = [];
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.drawImage(faceImage, 0, 0, gameCanvas.width, gameCanvas.height);

}
