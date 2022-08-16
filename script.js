import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui' 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import {GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {DoubleSide} from 'three'
import { HemisphereLight } from 'three'
import atmosphereVertexShader from '/shaders/atmosphereVertexShader.glsl'
import atmosphereFragmentShader from '/shaders/atmosphereFragmentShader.glsl'
import { Vectoor3 } from './vectors';
import {Lensflare } from 'three/examples/jsm/objects/Lensflare.js'
import {LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
//_____________________________________________________________________________________________________________
//PHYSICYS VARS
let ratioR = 1
let r   = 6380e3
let Me  = 5.98e24
let Ms  = 10
let G   = 6.67e-11
let cd  = 0.01
let a   = 0.01
let p0x = 0
let p0y = 0
let p0z = 42166000
let scaler = 1e-6
let density = 1.5
let smokedensity = 50
//_____________________________________________________________________________________________________________
//GLOBAL VARS
let dt =100;
let earthdaytime = 18
let decrease   = true
let increase   = false
let ready      = false 
let particles  = null
let camerasList= null
let oparticles = 1
let osatellitee= 1
let AcollisionTreatment = 1
let sat_array           =[],
    smoke_array         =[],
    CardHTML_arr        =[],
    physycs_Array       =[],
    cameras_array       =[],
    smokeParticles      =[],
    portalParticles     =[],
    trackingflare_array =[];
const clock = new THREE.Clock()
const cameraPos = new THREE.Object3D 
        cameraPos.sat=0 
//_____________________________________________________________________________________________________________
//Control Panel
const   gui = new dat.GUI({width: 300})
gui.hide();
//_____________________________________________________________________________________________________________
// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
//_____________________________________________________________________________________________________________
// Canvas
const canvas = document.querySelector('canvas.webgl')
// Scene
const scene = new THREE.Scene()
// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas , alpha:true ,antialias:true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000,1);
//_____________________________________________________________________________________________________________
// Loading antro
const loadingbarele = document.querySelector('.loading_bar ')
const overlayele = document.querySelector('.overlay')
const loadingManager = new THREE.LoadingManager(
// on load
    () => {
        ready = true
        gsap.delayedCall(1.5 , () => {
            overlayele.style.opacity ='0'
            overlayele.style.display ='none'
            loadingbarele.classList.add('ended')
            loadingbarele.style.transform = ``
        })
        setTimeout(()=>{gui.show()},3000)
    },
// on progress
    (url,itemloaded,itemtotal) => {
        ready = false
        const progressRatio = itemloaded/itemtotal
        loadingbarele.style.transform = `scaleX(${progressRatio})`;
        gui.hide()
    }
)
const satelliteModel    = new GLTFLoader(loadingManager)
const textureloader     = new THREE.TextureLoader(loadingManager)
//_____________________________________________________________________________________________________________
// textures
const galaxyTexture     = textureloader.load('galaxy1.jpg')
const cloudTexture      = textureloader.load('Cloud Map.jpg')
const earthTexture      = textureloader.load('earth.jpg')
const sunlinesTexture   = textureloader.load('sunlines.jpg')
const smokeTexture      = textureloader.load('smoke.jpg')
const earthbmp          = textureloader.load('fearthmap.jpg')
const particleTexture   = textureloader.load('fire.jpg')
const textureFlare0     = textureloader.load( "lensflare.jpg" );
const textureFlare1     = textureloader.load( "lensflare.jpg" );
const textureFlare2     = textureloader.load( "whitelensflare.jpg" );
const redlensflare      = textureloader.load( "redlensflare.png" );
//_____________________________________________________________________________________________________________
// Lights
const hemolight         = new HemisphereLight(0xffffff,0x000000, 1)
const pointlight        = new THREE.PointLight(0xffffff ,1 )
hemolight .position.set(-200,0,0)
pointlight.position.set(-200,0,0)
scene.add(hemolight)
scene.add(pointlight)
//_____________________________________________________________________________________________________________
// sun lensflare light
const light         = new THREE.PointLight( 0xffffff, 0.0, 1500 );
const lensflare     = new Lensflare();
lensflare.addElement( new LensflareElement( textureFlare0, 300, 0 ) );
lensflare.addElement( new LensflareElement( textureFlare1, 300, 0 ) );
light.add( lensflare );
light.position.set(-495,0,0)
scene.add(light)
//_____________________________________________________________________________________________________________
// atmosphere
const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry((r * scaler)+ 3,100,100),
    new THREE.ShaderMaterial({
        vertexShader  : atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending      : THREE.AdditiveBlending,
        side          :THREE.BackSide,
        transparent   :true,
        opacity       :0.01 })
                                )
scene.add(atmosphere)
//_____________________________________________________________________________________________________________
//clouds
const cloudGeometry = new THREE.SphereBufferGeometry((r * scaler)+0.03,100,100)
const cloudMaterial = new THREE.MeshStandardMaterial()
        cloudMaterial.map         = cloudTexture
        cloudMaterial.side        = THREE.DoubleSide
        cloudMaterial.opacity     = 0.8
        cloudMaterial.transparent = true
        cloudMaterial.alphaMap    = cloudTexture
const cloudMesh    = new THREE.Mesh(cloudGeometry, cloudMaterial)
scene.add(cloudMesh)
//_____________________________________________________________________________________________________________
//earth
const earthGeometry = new THREE.SphereBufferGeometry((r * scaler),100,100)
const earthMaterial = new THREE.MeshStandardMaterial({
    map              : earthTexture,
    displacementMap  : earthbmp,
    displacementScale: 0.09,
    bumpMap          : earthbmp,
    bumpScale        : 0.1,  
    side             : THREE.DoubleSide
})
const earthMesh    = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earthMesh)
//_____________________________________________________________________________________________________________
//galaxy
const galaxyGemotry  = new THREE.SphereBufferGeometry((r * scaler)*200,200,200)
const galaxyMaterial = new THREE.MeshBasicMaterial()
        galaxyMaterial.map         = galaxyTexture
        galaxyMaterial.side        = THREE.DoubleSide
        galaxyMaterial.opacity     = 0.7
        galaxyMaterial.transparent = true
        galaxyMaterial.alphaMap    =galaxyTexture
const galaxyMesh    = new THREE.Mesh(galaxyGemotry, galaxyMaterial)
scene.add(galaxyMesh)
//_____________________________________________________________________________________________________________
// sunlines
const sunlinesg  = new THREE.CircleGeometry( 128, 128 )
const sunlinesm  = new THREE.MeshPhysicalMaterial()
        sunlinesm.map         = sunlinesTexture
        sunlinesm.opacity     = 5
        sunlinesm.side        = DoubleSide
        sunlinesm.transparent = true
        sunlinesm.alphaMap    = sunlinesTexture
const sunlinemesh = new THREE.Mesh(sunlinesg, sunlinesm)
sunlinemesh.position.set(-500,0,5)
sunlinemesh.rotation.y=1.55
scene.add(sunlinemesh)
//_____________________________________________________________________________________________________________
//dust
    const dustcount    = {ds :10000}
    const dustGeometry = new THREE.SphereBufferGeometry((r * scaler)+ 50,100,100)
    const positions    = new Float32Array(dustcount.ds * 3)
        for(let j=0; j<=360;j++){
            for(let i =0 ; i < (dustcount.ds *3 ); i++ ){
                positions[i]   = Math.cos(i) * (Math.random() -0.5)*  ((r * scaler)+ 10)
                positions[i+1] = Math.sin(i)* (Math.random() -0.5)* ((r * scaler)+ 10)
                positions[i+2] = Math.sin(i)* (Math.random() -0.5)* ((r * scaler)+ 10)
            }
        }
        dustGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
                                )
    const dustMatiral = new THREE.PointsMaterial({
        size            :0.00001,
        transparent     :true,
        sizeAttenuation :true,
        depthWrite      :true,      
        opacity         :0.09,
    })
    const dust = new THREE.Points(dustGeometry,dustMatiral)
    scene.add(dust)
//_____________________________________________________________________________________________________________
//create fire
function createfire(x,y,z){
    const particlesGeometry = new THREE.SphereBufferGeometry(0.3,8,8)
    // Material
    const particlesMaterial = new THREE.PointsMaterial()
    particlesMaterial.size            = 2
    particlesMaterial.transparent     = true
    particlesMaterial.color           = new THREE.Color(0xFFFF30)
    particlesMaterial.sizeAttenuation = true
    particlesMaterial.alphaMap        = particleTexture
    particlesMaterial.map             = particleTexture
    particlesMaterial.alphaTest       = 0.1
    particlesMaterial.opacity         = 0.5
    // Points mesh
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particles.position.set(x,y,z)
    scene.add(particles)
    return particles
}
//_____________________________________________________________________________________________________________
//smoke cloud
function createsmokeMesh (x,y,z){
    const smokecloud    = new THREE.Mesh()
    const portalLight = new THREE.PointLight(0xffffff, 1, 0.7);
    scene.add(portalLight);
    portalLight.position.set(x*(0.03) ,y*(0.03) , z*(0.03) +1.26 );
    const portalGeo     = new THREE.PlaneBufferGeometry(35,35);
    const portalMaterial= new THREE.MeshStandardMaterial({
        map         :smokeTexture,
        transparent : true,
        alphaMap    :smokeTexture,
        side        : DoubleSide,
        transparent :true,
        depthWrite  :false ,  
                                                        });
    const smokeGeo      = new THREE.PlaneBufferGeometry(35,35);
    const smokeMaterial = new THREE.MeshStandardMaterial({
        map         :smokeTexture,
        transparent :true,
        alphaMap    :smokeTexture,
        alphaTest   :0.02,
        side        :DoubleSide,
        transparent :true,
        depthWrite  :false,  
                                                    });
    for(let p=880;p>250;p--) {
        let particle = new THREE.Mesh(portalGeo,portalMaterial);
        particle.position.set(
            x +  ( 0.025 * p * Math.cos((4 * p * Math.PI) / 180)),
            y +  ( 0.025 * p * Math.sin((4 * p * Math.PI) / 180)),
            z +  ( 0.050  * p )
        );
        particle.rotation.z = Math.random() *360;
        portalParticles.push(particle);
        smokecloud.add(particle);
    }
    for(let p=0;p<40;p++) {
        let particle2 = new THREE.Mesh(smokeGeo,smokeMaterial);
        particle2.position.set(
        x +( Math.random() * 1000-500)    *0.005,
        y +( Math.random() * 400-200)     *0.005,
        z +( Math.random() * 0.01-0.01  ) +0.02
        );
        particle2.rotation.z = Math.random() *360;
        particle2.rotation.y = Math.PI/2;
        particle2.material.opacity = 0.6;
        portalParticles.push(particle2);
        smokecloud.add(particle2);
    }
    smoke_array.push(smokecloud ,portalLight)
    smokecloud.scale.set(0.03,0.03,0.03)
    scene.add(smokecloud)
}
//_____________________________________________________________________________________________________________
//create satellite
function createsatellite(x,y,z,size) {
    let satelliteMesh = new THREE.Mesh()
        satelliteModel.load('satellite (2)/scene.gltf',
        (satelliteModel)=>{
            satelliteModel.scene.scale.set(size, size, size);
            satelliteModel.scene.position.set(x * scaler, y * scaler, z * scaler);
            // satelliteModel.scene.rotateY(Math.PI/2)
            satelliteMesh.add(satelliteModel.scene)   
            sat_array.push(satelliteMesh)
            create_camera(sat_array[sat_array.length -1].children[0].position.x ,(sat_array[sat_array.length -1].children[0].position.y),sat_array[sat_array.length -1].children[0].position.z ,sat_array[sat_array.length -1].children[0].position)
            createPhysycsObj(CreateSatallite.vx,CreateSatallite.vy, CreateSatallite.vz,sat_array.length-1)
            createHTMLCard(sat_array.length -1)
            createtrackingflare(x* scaler, y * scaler, z * scaler)
            scene.add( sat_array[sat_array.length -1])
                        }
                            )
                                }
//_____________________________________________________________________________________________________________
// create lensflare tracking the satellite
let lensflareSize = new LensflareElement( redlensflare, 30, 0 ) 
function createtrackingflare (x,y,z){
    let light = new THREE.PointLight( 0xffffff, 0.0, 500 );
    let lensflare = new Lensflare();
        lensflare.addElement(lensflareSize);
        lensflare.addElement(lensflareSize);
        light.position.set(x,y,z);
        light.add( lensflare );
        trackingflare_array.push(light)
        scene.add(trackingflare_array[trackingflare_array.length-1])
}
//_____________________________________________________________________________________________________________
// create lensflare with  the collision
let lensflareSize2 = new LensflareElement( textureFlare2, 100, 0 ) 
let light2 = new THREE.PointLight( 0xffffff, 0.0, 500 );
function createwhiteflare (x,y,z){
    let lensflare = new Lensflare();
        lensflare.addElement(lensflareSize2);
        lensflare.addElement(lensflareSize2);
        light2.position.set(x,y,z);
        light2.add( lensflare );
        trackingflare_array.push(light2)
        scene.add(light2)
}
//_____________________________________________________________________________________________________________
//Cameras
function  create_camera(x,y,z,lookat){ 
    let i = cameras_array.length 
            cameras_array[i] = new THREE.PerspectiveCamera(80,sizes.width/sizes.height,0.01,10000) 
            cameras_array[i].position.x=x 
            cameras_array[i].position.y=y 
            cameras_array[i].position.z=z 
            // cameras_array[i].lookAt(earthMesh.position) 
            cameras_array[i].lookAt(lookat) 
    scene.add(cameras_array[i]) 
    if( i > 0)  {
            cameras_array[i+1] = new THREE.OrthographicCamera(1.5,-1.5,1.5,-1.5,0.1,20) 
            cameras_array[i+1].position.x=x * (0.3)
            cameras_array[i+1].position.y=y *(0.3)
            cameras_array[i+1].position.z=z *(0.3)
            cameras_array[i+1].lookAt(earthMesh.position) 
    scene.add(cameras_array[i+1]) 
                }
                                    } 
//_____________________________________________________________________________________________________________
// update sizes && renderer
    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
        // Update camera
        cameras_array[cameraPos.sat].aspect = sizes.width / sizes.height
        //uncomment
        cameras_array[cameraPos.sat].updateProjectionMatrix()
        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
//_____________________________________________________________________________________________________________
// earth Object For Control Panel
    let editEarth = {
    R : r,
    M : Me ,
    AtmoHeight : 1 ,
    AirDensity : density ,
    changeatt : ()=>{
        ratioR = editEarth.R/r
        earthMesh.scale.set((editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler))
        cloudMesh.scale.set((editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler))
        galaxyMesh.scale.set((editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler),(editEarth.R*scaler)/(6380e3*scaler))
        atmosphere.scale.set(editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler),editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler),editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler))
        dust.scale.set(editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler),editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler),editEarth.AtmoHeight*(editEarth.R*scaler)/(6380e3*scaler))
        for(let i= 0 ;i < physycs_Array.length ; i++){
            physycs_Array[i].resetT(i);
        }
    }
                    }
 // function to show the sats in list
    let sl= gui.addFolder('SatalliteList')
    function getList() {
        setTimeout(() => {
            for(let i = 0 ; i < (sat_array.length +6) ;i++){
                if(sl.__folders[`sat${i+1}`] != null){
                    sl.removeFolder( sl.__folders[`sat${i+1}`])
                }
            }
            for(let i = 0 ; i < (sat_array.length) ;i++){
                if(sl.__folders[`sat${i+1}`] != null){
                    sl.removeFolder( sl.__folders[`sat${i+1}`])
                if(sl.__folders[`sat${i+2}`] != null)
                    sl.removeFolder( sl.__folders[`sat${i+2}`])
                }
                if( sat_array[i] != null && physycs_Array[i] != null ){
                    let s =  sat_array[i].children[0]
                    let ph =  physycs_Array[i]
                    let phu = {
                        phupdate : () =>{
                            ph.update(i)
                        }
                    }
                    let a = sl.addFolder(`sat${i+1}`)
                        a.add( ph , 'fx')
                        a.add( ph , 'fy')
                        a.add( ph , 'fz')
                        a.add( phu , 'phupdate').name('Apply Force').onChange(()=>{
                        ph.applyFflag = true
                            }
                        )
                        a.add(removesat, `button`).name('Remove Satellite').onChange(() => {
                            removesat.removesat(i)
                            CardHTML_arr[i].mremoveHTML()
                            CardHTML_arr.splice(i,1)
                            }
                        )
                        a.add(CardHTML_arr[i], `showbox`).name('Show Details').onChange(() => {
                            CardHTML_arr[i].showHTML()
                            }
                        )
                        a.add(CardHTML_arr[i], `track`).name('Flare Tracking').onChange(() => {
                            if(CardHTML_arr[i].track)
                            trackingflare_array[i].visible = true;
                            else trackingflare_array[i].visible = false;
                            }
                        )
                }
            }
            gui.show()  
        }, 2500)
    }
    // create sat object for control panel
    let CreateSatallite ={
        x  : p0x,
        y  : p0y,
        z  : p0z,
        vx : 3070,
        vy : 0,
        vz : 0,
        create:()  => {
            createsatellite(CreateSatallite.x,CreateSatallite.y, CreateSatallite.z ,0.05)
            setTimeout(() => {
                getList()
                gui.remove(camerasList)
                camerasList = gui.add(cameraPos,'sat').min(0).max(cameras_array.length -1).step(1).name('Cameras')
            }, 1000)
        }
                        }
    // object for time speed
    let TimeScaleobj={
        dtsteps:1,
    }
    // control panel init list
    setTimeout(() => {
        const   ee=gui.addFolder('PlanetProps')
                ee.add(editEarth , 'R').name('Raduis')
                ee.add(editEarth , 'M').name('Mass')
                ee.add(editEarth , 'AtmoHeight').name('atmospheric altitude').min(0).max(2).step(0.1)
                ee.add(editEarth , 'AirDensity').name('Air Density').min(0).max(100).step(0.1)
                ee.add(editEarth , 'changeatt').name('save')
        const   cs=gui.addFolder('CreateSatallite')
                cs.add(CreateSatallite , 'x')
                cs.add(CreateSatallite , 'y')
                cs.add(CreateSatallite , 'z')
                cs.add(CreateSatallite , 'vx')
                cs.add(CreateSatallite , 'vy')
                cs.add(CreateSatallite , 'vz')
                cs.add(CreateSatallite , 'create')
        camerasList = gui.add(cameraPos,'sat').min(0).max(cameras_array.length -1).step(1).name('Cameras')
        const TimeScale=gui.add(TimeScaleobj ,'dtsteps').min(0.5).max(2).step(0.5).name('Time Speed').onChange(() => {
            dt = 100 *TimeScaleobj.dtsteps
            earthdaytime = 18/TimeScaleobj.dtsteps
            calcT.innerHTML =''
            calcT.innerHTML = `1 Real Day = ${earthdaytime} s`

        })
                    }, 3000); 

//card real time
let calcT = document.querySelector('.calcT')
calcT.innerHTML = `1 Real Day = ${earthdaytime} s`

//_____________________________________________________________________________________________________________
//Satellite collision 
    function Satcollision (){
        if(AcollisionTreatment <= 2 ){
            for(let i = 0 ; i <sat_array.length; i++){
                let s1 = sat_array[i].children[0].position
                for(let j = i+1 ; j<sat_array.length ; j++){
                    let s2 = sat_array[j].children[0].position
                    if(( s2.x- 2 <=  s1.x && s1.x<= s2.x+ 2 )&&( s2.y- 2 <=  s1.y && s1.y <= s2.y + 2 )&& ( s2.z- 2 <=  s1.z && s1.z<= s2.z+ 2 )){
                        AcollisionTreatment           += 1     
                        physycs_Array[i].collisionFlag = true
                        physycs_Array[j].collisionFlag = true
                        scene.remove(sat_array[i])
                        scene.remove(sat_array[j])
                        scene.remove(trackingflare_array[i])
                        scene.remove(trackingflare_array[j])    
                        scene.remove(cameras_array[2*i+1])
                        scene.remove(cameras_array[2*i+2])     
                        scene.remove(cameras_array[2*j+1])
                        scene.remove(cameras_array[2*j+2])
                        CardHTML_arr[i].collisionHTML()
                        CardHTML_arr[j].collisionHTML()
                        if( AcollisionTreatment == 2){
                           createsmokeMesh(s1.x *(100/3) , s1.y *(100/3), s1.z*(100/3))
                            createwhiteflare(s1.x,s1.y,s1.z)
                        }   
                        setTimeout(() => {
                            cameraPos.sat = 0
                            CardHTML_arr       .splice(i,1)
                            CardHTML_arr       .splice(j,1)
                            sat_array          .splice(i,1)
                            physycs_Array      .splice(i,1)
                            cameras_array      .splice(2*i+1,2)
                            sat_array          .splice(j,1)
                            physycs_Array      .splice(j,1)
                            cameras_array      .splice(2*j+1,2)
                            trackingflare_array.splice(i,1)
                            trackingflare_array.splice(j,1)
                            gui.remove(camerasList)
                            camerasList = gui.add(cameraPos,'sat').min(0).max(cameras_array.length -1).step(1).name('Cameras')
                            if(sl.__folders[`sat${i+1}`])
                                sl.removeFolder( sl.__folders[`sat${i+1}`])
                            if(sl.__folders[`sat${j+1}`])
                                sl.removeFolder( sl.__folders[`sat${j+1}`])
                            AcollisionTreatment = 1
                            scene.remove(light2)
                            lensflareSize2.size = 100
                                            }, 3000)
                    break;
                    }
                break;
                }
            }
        }
    }
//_____________________________________________________________________________________________________________
//Create Physycs Objects for each sat
function createPhysycsObj(v0x,v0y,v0z,i){
    if(sat_array[i] !=null){
        let physycs_objects =  {
            h:0,
            v0x,
            v0y,
            v0z,
            T:0,
            f:0,
            fx:10,
            fy:10,
            fz:10,
            flag: true,
            applyFflag :false , 
            collisionFlag :false, 
            oldR: editEarth.R,
            e   :earthMesh.position,  
            acc:        new Vectoor3(),
            drag:       new Vectoor3(),
            force:      new Vectoor3(),
            direction:  new Vectoor3(),
            velocity :  new Vectoor3(0, 0, 0),
            s1 : sat_array[i].children[0].position,
            semiMajor: sat_array[i].children[0].position.clone().divideScalar(scaler).length(),
        // Methods
            firststate : () => {
                if (physycs_objects.flag) {
                    physycs_objects.velocity.x += physycs_objects.v0x ;
                    physycs_objects.velocity.y += physycs_objects.v0y ;
                    physycs_objects.velocity.z += physycs_objects.v0z ;
                    physycs_objects.flag = false;
                }
            },
            update: (ij)=>{
                physycs_objects.s1 =sat_array[ij].children[0].position.clone()
                physycs_objects.s1.divideScalar(scaler)
                physycs_objects.direction = new Vectoor3(physycs_objects.e.x - physycs_objects.s1.x, physycs_objects.e.y - physycs_objects.s1.y, physycs_objects.e.z - physycs_objects.s1.z);
                physycs_objects.h         = (physycs_objects.direction.calcMagnitude()) - (editEarth.R);
                let R  = ratioR*(editEarth.R + physycs_objects.h);
                let R2 = Math.pow(R, 2);
                physycs_objects.oldR = editEarth.R ;
            // for calc the time period after any change
                if (R > physycs_objects.semiMajor) {
                    physycs_objects.semiMajor = R
                }
                if(physycs_objects.semiMajor >= R){
                    let a3 = Math.pow(physycs_objects.semiMajor, 3);
                    let pi2 = Math.pow(Math.PI, 2);
                    physycs_objects.T = Math.sqrt((4 * pi2 * a3) / (G * editEarth.M));
                }
                physycs_objects.f = (G * Ms * editEarth.M) / R2; 
                physycs_objects.force = physycs_objects.direction.clone().calcNormalizedVector();        
                physycs_objects.force = physycs_objects.force.scalarProduct(physycs_objects.f)
            // atmosphere draging
                if(editEarth.R * scaler <= physycs_objects.h * scaler &&  ( editEarth.R * scaler *editEarth.AtmoHeight)+5 >=physycs_objects.h* scaler){
                    physycs_objects.applydrag();
                    physycs_objects.resetT(ij)
                    CardHTML_arr[ij].dragingHTML()
                }
            // smokecloud draging
                for(let j = 0 ; j < smoke_array.length ; j+= 2){
                    if ((physycs_objects.s1.x *scaler < ((smoke_array[j].children[0].position.x / (100/3)) + 3) && physycs_objects.s1.x *scaler > ((smoke_array[j].children[0].position.x /(100/3)) - 3)) && (physycs_objects.s1.y *scaler< ((smoke_array[j].children[0].position.y / (100/3)) + 3) && physycs_objects.s1.y *scaler> ((smoke_array[j].children[0].position.y /(100/3)) - 3)) && (physycs_objects.s1.z*scaler < ((smoke_array[j].children[0].position.z /(100/3)) + 3) && physycs_objects.s1.z*scaler > ((smoke_array[j].children[0].position.z / (100/3)) - 3))) {
                        physycs_objects.applySmokedrag();
                        CardHTML_arr[ij].dragingHTML()
                        physycs_objects.resetT(ij)
                    }
                }
                if(physycs_objects.applyFflag){
                    physycs_objects.applyforce()
                    physycs_objects.resetT(ij)
                    physycs_objects.applyFflag = false
                }
                physycs_objects.acc = physycs_objects.force.scalarProduct(1 / Ms);
                let tempA = physycs_objects.acc.scalarProduct(dt)
                physycs_objects.velocity.add(tempA);
                physycs_objects.firststate();
                let tempV = physycs_objects.velocity.scalarProduct(dt)
                physycs_objects.s1.add(tempV );
                physycs_objects.s1.multiplyScalar(scaler);
                sat_array[ij].children[0].position.set(physycs_objects.s1.x , physycs_objects.s1.y , physycs_objects.s1.z)
                
            },
            applydrag:() => {
                if(Math.abs(physycs_objects.velocity.calcMagnitude())>0)
                {
                physycs_objects.drag = physycs_objects.velocity.clone();
                physycs_objects.drag = physycs_objects.drag.calcNormalizedVector();
                physycs_objects.drag.inverse();
                let d = (1/2)* cd * a * editEarth.AirDensity * physycs_objects.velocity.calcMagnitude()
                physycs_objects.drag =physycs_objects.drag.scalarProduct(d)
                physycs_objects.force.add(physycs_objects.drag);
            }
            },
            applySmokedrag:() => {
                if(Math.abs(physycs_objects.velocity.calcMagnitude())>0){
                physycs_objects.drag = physycs_objects.velocity.clone();
                physycs_objects.drag = physycs_objects.drag.calcNormalizedVector();
                physycs_objects.drag.inverse();
                let d = (1/2)* cd * a * smokedensity * physycs_objects.velocity.calcMagnitude()
                physycs_objects.drag =physycs_objects.drag.scalarProduct(d)
                physycs_objects.force.add(physycs_objects.drag);   }             
            },
            applyforce: () =>{
                physycs_objects.force.x += physycs_objects.fx
                physycs_objects.force.y += physycs_objects.fy
                physycs_objects.force.z += physycs_objects.fz
            },
            resetT: (i) => {
                physycs_objects.semiMajor = sat_array[i].children[0].position.clone().divideScalar(scaler).length()
                }
        }
        physycs_Array.push(physycs_objects)
    }
}
//_____________________________________________________________________________________________________________
// object to toggle function to remove sat 
let removesat = {
    button : () =>{},
    removesat: (i) => {
        scene.remove(sat_array[i])
        scene.remove(cameras_array[2*i+1])
        scene.remove(cameras_array[2*i+2])
        scene.remove(trackingflare_array[i])
        sat_array           .splice(i,1)
        physycs_Array       .splice(i,1)
        cameras_array       .splice(2*i+1,2)
        trackingflare_array .splice(i,1)
        if(sl.__folders[`sat${i+1}`] != null){
            sl.removeFolder( sl.__folders[`sat${i+1}`])
        }
        cameraPos.sat = 0
        gui.hide()
        setTimeout(() => {
            getList()
            gui.remove(camerasList)
            camerasList = gui.add(cameraPos,'sat').min(0).max(cameras_array.length -1).step(1).name('Cameras')
        }, 1000)
    }
}
//_____________________________________________________________________________________________________________
// function to create the details card for each sat
function createHTMLCard(i){
    let obj = {
        id : i,
        title: `Sat${i+1}`,
        velocity:  physycs_Array[i].velocity.calcMagnitude(),
        Height: physycs_Array[i].h,
        Time: physycs_Array[i].T,
        sat : document.querySelector('.Sats '),
        satid : document.createElement('div'),
        sattitle : document.createElement('h1'),
        satvel : document.createElement('pre'),
        sathie : document.createElement('pre'),
        satTime : document.createElement('pre'),
        showbox: true,
        track: true,
        createHTML:() =>{
            obj.satid.classList.add('sat' , 'active')
            obj.sat.appendChild(obj.satid)
            obj.sattitle.classList.add('title')
            obj.sattitle.innerHTML = `${obj.title}`
            obj.satid.appendChild(obj.sattitle)
            obj.satvel.innerHTML = `Velocity : ${obj.velocity} Km/H`
            obj.satid.appendChild(obj.satvel)
            obj.sathie.innerHTML = `Height : ${obj.Height} m`
            obj.satid.appendChild(obj.sathie)
            obj.satTime.innerHTML = `Orbital Period : ${obj.Time} d`
            obj.satid.appendChild(obj.satTime)
        },
        updateHTML: (x) =>{
            if(physycs_Array[x] !=null){
            obj.sattitle.innerHTML = `Sat${x+1}`
            obj.satvel.innerHTML =  `Velocity       : ${(physycs_Array[x].velocity.calcMagnitude()).toFixed(2)} m/s`
            obj.sathie.innerHTML =  `Height         : ${ Math.round( physycs_Array[x].h)} m`
            obj.satTime.innerHTML = `Orbital Period : ${(physycs_Array[x].T / (60 * 60 * 24)).toFixed(2)} D`
        }
        },
        collisionHTML:() =>{
            obj.satid.classList.add('collision')
            let coll = document.createElement('h1')
            coll.classList.add('collisionactive')
            coll.innerHTML = 'Collision'
            obj.satid.appendChild(coll)
            setTimeout(() => {
                obj.removeHTML()
            }, 1000);
        },
        mremoveHTML : () =>{
            obj.satid.classList.add('removed')
            let mrem = document.createElement('h1')
            mrem.classList.add('removedactive')
            mrem.innerHTML = 'Removed'
            obj.satid.appendChild(mrem)
            setTimeout(() => {
                obj.removeHTML()
            }, 1000);
        },
        dragingHTML : () =>{
            obj.satid.classList.add('draging')
            let drag = document.createElement('h1')
            drag.classList.add('dragingactive')
            if( drag.innerHTML == ''){
                drag.innerHTML = 'Draging'}
            obj.satid.appendChild(drag)
            setTimeout(() => {
                obj.satid.classList.remove('draging')
                obj.satid.removeChild(drag)
            }, 50);
        },
        removeHTML : () =>{
            obj.satid.classList.toggle('nonactive')
            obj.satid.classList.toggle('active')
            setTimeout(()=>{
                obj.satid.style.cssText = 'display : none !important ;'
            },2500)
        },
        showHTML :() =>{
            obj.satid.classList.toggle('nonactive')
            obj.satid.classList.toggle('active')
            setTimeout(() => {
                if(obj.satid.classList.contains('nonactive')){
                    obj.satid.style.cssText = 'display : none !important ;'}
                else{
                    obj.satid.style.cssText = 'display : block !important ;'
                }     
            }, 1500);
        }
    }
    CardHTML_arr.push(obj);
    CardHTML_arr[i].createHTML()
}
// initializtion  
const camera0 =create_camera(0,0,10,earthMesh.position) 
createsmokeMesh(0,0,50000000 * scaler * (100/3))
createsatellite(0,0,42166000,0.05)
// createsatellite(0,0,62166000,0.05)
getList()
//_____________________________________________________________________________________________________________
//controls init
const   controls = new OrbitControls( cameras_array[0], canvas )
        controls.enableDamping =true
        controls.maxDistance = 30
        controls.minDistance = 1.2
        controls.enablePan=false
        controls.target = earthMesh.position
        cameras_array[0].position.set( 0, 5, 60 );



//_____________________________________________________________________________________________________________
const tick = () =>
    {
        let delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime()
    //Loading Ready
        if(ready) {
    //Lens flare power
            if (decrease) {
                if (lensflareSize.size > 0){
                    lensflareSize.size -= 0.5
                }
                else{
                decrease = false
                increase = true
                }
            }
            if (increase){ 
                if ( lensflareSize.size < 30){
                    lensflareSize.size += 0.5
                }
                else{
                increase = false
                decrease = true
                }
            }

    // Update Design
            for(let i = 0 ; i< sat_array.length ; i++){
                    // white lens flare
            if (lensflareSize2.size > 0 && physycs_Array[i].collisionFlag ){
                lensflareSize2.size -= 1
            }

            // lensflareSize2.size = 100;
                //Update HTML
                if(CardHTML_arr[i] !=null  && !physycs_Array[i].collisionFlag){
                    CardHTML_arr[i].updateHTML(i)
                }
                if(physycs_Array[i] !=null){
                    if(!physycs_Array[i].collisionFlag){
                        //to remove
                        physycs_Array[i].s1 = sat_array[i].children[0].position
                        physycs_Array[i].update(i);
                    } 
                }
                if(sat_array[i] != null)
                {
                 // orbit draw
                    let s = sat_array[i].children[0].position
                    if(cameraPos.sat ==0 &&  !physycs_Array[i].collisionFlag){
                        const bg = new THREE.SphereBufferGeometry(0.1,16,16)
                        const bm = new THREE.MeshBasicMaterial({ color: 0xffffff , opacity:5})
                        const boxmesh = new THREE.Mesh(bg, bm)
                        scene.add(boxmesh)
                        boxmesh.position.set(s.x  ,s.y ,s.z )
                        setTimeout(()=>{
                            scene.remove(boxmesh)
                        },4000)
                    // flare draw
                        trackingflare_array[i].position.set(s.x,s.y,s.z)
                    }
                //collisiom with earth
                    if(( s.x <= editEarth.R*scaler && s.x >= -editEarth.R*scaler )&&( s.y <= editEarth.R*scaler && s.y >= -editEarth.R*scaler )&&(s.z <= editEarth.R*scaler  && s.z >= -editEarth.R*scaler )){
                        particles =createfire(s.x  ,s.y  ,s.z  )
                        CardHTML_arr[i].collisionHTML()
                        CardHTML_arr.splice(i,1)
                        removesat.removesat(i)
                    }
                }
            }
        }
    // Fire Animating
        if(particles != null){
            particles.rotation.y=elapsedTime*2
            particles.rotation.z=elapsedTime*0.5
            particles.rotation.x=elapsedTime*1.25
            if(osatellitee>0 && oparticles>0)
            {
                particles.scale.x     = oparticles
                particles.position.x *= osatellitee
                particles.position.y *= osatellitee
                particles.position.z *= osatellitee
                particles.scale.y      =oparticles
                particles.scale.z      =oparticles
                osatellitee -= 0.000008
                oparticles  -= 0.005
            }
            else 
            { 
                scene.remove(particles)
                particles = null
                osatellitee =1
                oparticles =1
            }
        }
    // animate smokecloud
        portalParticles.forEach(p => {
            p.rotation.z -= delta +0.0008;
        });
        smokeParticles.forEach(p => {
            p.rotation.z -= delta +0.0002;
        });
    // smokecloud light power
        for(let i = 1 ; i< smoke_array.length ; i +=2){
                if(Math.random() > 0.8) {
                smoke_array[i].power =50 + Math.random()*200;
            }
        }
    // animate dust
        dust.rotation.y = elapsedTime * 0.15
    // rotate earth and clouds
        gsap.to(earthMesh.rotation, (earthdaytime), { y: earthMesh.rotation.y + Math.PI  *0.5 })
        gsap.to(cloudMesh.rotation, (earthdaytime), { y: cloudMesh.rotation.y + Math.PI })

    // Controls & Camera options   
        if(cameraPos.sat ==0){
            //to edit earthedit.r
            controls.maxDistance = ( r * scaler )*30
            controls.minDistance =( r * scaler ) +5
            controls.target = earthMesh.position
            controls.object = cameras_array[0]
            controls.enabled = true
        }
        for(let i = 1; i <= cameras_array.length ; i+=2){
            if(cameraPos.sat == i){
                if(cameras_array[i] != null){
                    controls.maxDistance = 10
                    controls.minDistance = 5
                    controls.object = cameras_array[cameraPos.sat]
                    controls.target = sat_array[(cameraPos.sat-1)/2].children[0].position
                    controls.enabled = true
                }
            }
        }
        for(let i = 2; i <= cameras_array.length ; i+=2){
            if(cameraPos.sat == i){
                if(cameras_array[i] != null){
                let     sp = sat_array[(cameraPos.sat-2)/2].children[0].position
                        cameras_array[i].position.set(sp.x,sp.y,sp.z)
                        controls.object = cameras_array[cameraPos.sat]
                        controls.target = earthMesh.position
                        controls.enabled = false
                }
            }
        }
        Satcollision ()
        controls.update()      
        renderer.render(scene,cameras_array[cameraPos.sat]) 
        window.requestAnimationFrame(tick)
    }
tick();
