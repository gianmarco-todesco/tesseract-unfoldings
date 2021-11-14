let canvas, engine, scene, camera;
let actionMngr;

window.addEventListener('DOMContentLoaded', ()=>{
    canvas = document.getElementById('viewer');
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera('cam', 
            -1.4,1.2,
            6, 
            new BABYLON.Vector3(0,0,0), 
            scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 13*2;            
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(0,1,0), scene);
    light1.parent = camera;

    populateScene();
    createAxes(scene);
        
    engine.runRenderLoop(()=>scene.render());
    window.addEventListener("resize", () => engine.resize());


});

function createAxes(scene) {
    let Color4 = BABYLON.Color4;
    let Vector3 = BABYLON.Vector3;
     
    let m = 50;
    let r = 5;
    let pts = [];
    let colors = [];
    let c1 = new Color4(0.7,0.7,0.7,0.5);
    let c2 = new Color4(0.5,0.5,0.5,0.25);
    let cRed   = new Color4(0.8,0.1,0.1);
    let cGreen = new Color4(0.1,0.8,0.1);
    let cBlue  = new Color4(0.1,0.1,0.8);
    
    let color = c1;
    function line(x0,y0,z0, x1,y1,z1) { 
        pts.push([new Vector3(x0,y0,z0), new Vector3(x1,y1,z1)]); 
        colors.push([color,color]); 
    }
    
    /*
    for(let i=0;i<=m;i++) {
        if(i*2==m) continue;
        color = (i%5)==0 ? c1 : c2;
        let x = -r+2*r*i/m;        
        line(x,0,-r, x,0,r);
        line(-r,0,x, r,0,x);
    }
    */
    
    let r1 = r + 1;
    let a1 = 0.2;
    let a2 = 0.5;
    
    // x axis
    color = cRed;
    line(-r1,0,0, r1,0,0); 
    line(r1,0,0, r1-a2,0,a1);
    line(r1,0,0, r1-a2,0,-a1);
        
    // z axis
    color = cBlue;
    line(0,0,-r1, 0,0,r1); 
    line(0,0,r1, a1,0,r1-a2);
    line(0,0,r1,-a1,0,r1-a2);
    
    // y axis
    color = cGreen;
    line(0,-r1,0, 0,r1,0); 
    line(0,r1,0, a1,r1-a2,0);
    line(0,r1,0,-a1,r1-a2,0);
    line(0,r1,0, 0,r1-a2,a1);
    line(0,r1,0, 0,r1-a2,-a1);
    
    const lines = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", {
                lines: pts,
                colors: colors,
                
        }, 
        scene);
    return lines;  
}


let c1,c2;
let actionManager;


function uff(cube,a,b) {
    let p = cube.mesh.position.clone();
    let pa = cube.faceCenters[a];
    let pb = cube.faceCenters[b];
    let center = pa.add(pb).scale(0.5);
    let axis = BABYLON.Vector3.Cross(pb,pa);
    let startTime = performance.now();
    let fun = () => {
        let t = (performance.now()-startTime)*0.001;
        if(t>1) {
            scene.unregisterBeforeRender(fun);
            let rot = BABYLON.Quaternion.RotationAxis(axis, Math.PI/2);
            cube.mesh.rotationQuaternion = rot;
            p.rotateByQuaternionAroundPointToRef(rot, center, cube.mesh.position);
            return;
        }
        let rot = BABYLON.Quaternion.RotationAxis(axis, Math.PI/2*t);
        cube.mesh.rotationQuaternion = rot;
        p.rotateByQuaternionAroundPointToRef(rot, center, cube.mesh.position);
    };
    scene.registerBeforeRender(fun);

}

let tesseract;

function populateScene() {
    dirMaterials = [[1,0,0],[0,1,0],[0,0,1],[0,1,1],[1,0,1],[1,1,0]].map(c=>{
        let mat = new BABYLON.StandardMaterial('m',scene);
        mat.diffuseColor.set(...c);
        return mat;
    })
    innerCubeMaterial = new BABYLON.StandardMaterial('m',scene);
    innerCubeMaterial.diffuseColor.set(0.3,0.3,0.3);

    
    let t = tesseract = new Tesseract();
    t.createMeshes(scene)


    //c1 = new TCube();
    //c2 = new TCube();
    //c2.mesh.position.y = 1;
    //actionManager = new BABYLON.ActionManager(scene);
    scene.registerBeforeRender(() => {
        rotateBillboards(billboards);
    });
}


function rotateBillboards(lst) {
    let q0 = BABYLON.Quaternion.FromRotationMatrix(
        camera.getViewMatrix().clone().invert());

    lst.forEach(b => {
        let q1 = BABYLON.Quaternion.FromRotationMatrix(
            b.parent.getWorldMatrix().clone().invert());
        b.rotationQuaternion = q1.multiply(q0);
        // b.computeWorldMatrix(true);
    })
}

