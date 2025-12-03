// VR Setup for Three.js (compatible con versiones antiguas)
class VRManager {
    constructor(camera, renderer, scene) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        this.isVRMode = false;
        this.originalCamera = null;
        
        this.vrCamera = null;
        this.vrControls = null;
        this.vrEffect = null;
        
        this.init();
    }
    
    init() {
        // Guardar cámara original
        this.originalCamera = {
            position: this.camera.position.clone(),
            rotation: this.camera.rotation.clone(),
            fov: this.camera.fov,
            aspect: this.camera.aspect
        };
        
        // Verificar compatibilidad WebXR
        this.checkVRSupport();
    }
    
    checkVRSupport() {
        // Para versiones antiguas de Three.js
        if (typeof THREE.VREffect !== 'undefined' && typeof THREE.VRControls !== 'undefined') {
            console.log('VR disponible (modo legacy)');
            return true;
        }
        
        // Para WebXR moderno
        if ('xr' in navigator) {
            console.log('WebXR disponible');
            return true;
        }
        
        console.warn('VR no disponible en este navegador');
        return false;
    }
    
    setupLegacyVR() {
        // Para Three.js r90-r105
        this.vrEffect = new THREE.VREffect(this.renderer);
        this.vrControls = new THREE.VRControls(this.camera);
        
        // Configurar para Oculus Quest
        this.vrEffect.setSize(window.innerWidth, window.innerHeight);
        
        // Posicionar cámara en la pista de bolos
        this.camera.position.set(0, 1.6, 0); // Altura persona, al inicio de la pista
        this.camera.rotation.set(0, 0, 0);
        
        this.isVRMode = true;
    }
    
    setupWebXR() {
        // Para Three.js r106+
        this.renderer.xr.enabled = true;
        
        // Crear cámara stereo
        this.vrCamera = new THREE.PerspectiveCamera(
            this.camera.fov,
            this.camera.aspect,
            this.camera.near,
            this.camera.far
        );
        
        // Posicionar en la pista
        this.vrCamera.position.set(0, 1.6, 0);
        
        this.isVRMode = true;
    }
    
    enterVR() {
        if (this.isVRMode) return;
        
        // Ocultar botón de puntuación temporalmente
        document.querySelectorAll('div').forEach(div => {
            if (div.style.position === 'fixed') {
                div.style.display = 'none';
            }
        });
        
        // Intentar WebXR primero
        if (this.renderer.xr && 'xr' in navigator) {
            this.setupWebXR();
            this.enterWebXRSession();
        } 
        // Fallback a VR legacy
        else if (typeof THREE.VREffect !== 'undefined') {
            this.setupLegacyVR();
        } else {
            alert('VR no soportado en este navegador. Usa Meta Quest Browser.');
            return;
        }
        
        console.log('Modo VR activado');
        document.getElementById('vrButton').textContent = 'Salir VR';
        document.getElementById('vrButton').style.backgroundColor = '#f44336';
    }
    
    async enterWebXRSession() {
        try {
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor']
            });
            
            this.renderer.xr.setSession(session);
            
            // Reemplazar cámara principal
            this.scene.remove(this.camera);
            this.camera = this.vrCamera;
            this.scene.add(this.camera);
            
            // Evento para salir de VR
            session.addEventListener('end', () => this.exitVR());
            
        } catch (error) {
            console.error('Error al iniciar VR:', error);
            this.exitVR();
        }
    }
    
    exitVR() {
        if (!this.isVRMode) return;
        
        // Restaurar cámara original
        if (this.originalCamera) {
            this.camera.position.copy(this.originalCamera.position);
            this.camera.rotation.copy(this.originalCamera.rotation);
            this.camera.fov = this.originalCamera.fov;
            this.camera.aspect = this.originalCamera.aspect;
            this.camera.updateProjectionMatrix();
        }
        
        // Detener sesión WebXR
        if (this.renderer.xr && this.renderer.xr.getSession()) {
            this.renderer.xr.getSession().end();
        }
        
        // Restaurar renderizado normal
        if (this.vrEffect) {
            this.vrEffect.dispose();
            this.vrEffect = null;
            this.vrControls = null;
        }
        
        // Mostrar UI nuevamente
        document.querySelectorAll('div').forEach(div => {
            if (div.style.position === 'fixed') {
                div.style.display = 'block';
            }
        });
        
        this.isVRMode = false;
        
        // Actualizar botón
        document.getElementById('vrButton').textContent = 'Realidad Virtual';
        document.getElementById('vrButton').style.backgroundColor = '#4CAF50';
        
        console.log('Modo VR desactivado');
    }
    
    update() {
        if (this.isVRMode) {
            if (this.vrControls) {
                this.vrControls.update();
            }
            
            if (this.vrEffect) {
                this.vrEffect.render(this.scene, this.camera);
            }
        }
    }
}