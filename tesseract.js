
let billboards = [];
class TFace {
    constructor(cube, faceIndex) {
        this.cube = cube
        this.faceIndex = faceIndex
        this.position = new BABYLON.Vector3();
        this.linkedFace = null;
        this.linkedFaceQuaternion = null;
        this.chainIndex = 0;
        this.rot = new BABYLON.Vector3();
        this.mesh = null;   
        this.channel = 0;   
        this.mainColor = new BABYLON.Color3(0.7,0.7,0.7);
        this.highlightColor = new BABYLON.Color3(0.8,0.8,0.8);
    }

    setColor(color) {
        BABYLON.Color3.LerpToRef(
            color, 
            new BABYLON.Color3(0.5,0.5,0.5), 
            0.6,
            this.mainColor);
        this.highlightColor.copyFrom(color);
    }

    getId() {
        return this.cube.cubeIndex + "." + this.faceIndex;
    }

    createMesh(scene) {
        let faceMesh = this.mesh = BABYLON.MeshBuilder.CreateBox(
            'a', {width:0.8, depth:0.8, height:0.01}, 
            scene);
        if(this.getId() < this.linkedFace.getId()) {
            let matId = 'face-' + this.getId() + "-mat";
            faceMesh.material = new BABYLON.StandardMaterial(matId, scene);
            faceMesh.material.diffuseColor.copyFrom(this.mainColor);    
            if(this.linkedFace.mesh) 
                this.linkedFace.mesh.material = faceMesh.material;
        } else if(this.linkedFace.mesh) {
            faceMesh.material = this.linkedFace.mesh.material;
        }
        faceMesh.parent = this.cube.mesh;
        const r = 0.45;        
        faceMesh.position.copyFrom(this.position.scale(r));
        faceMesh.rotation.copyFrom(this.rot);  
        // faceMesh.computeWorldMatrix(true);          
        let actionMngr = this.mesh.actionManager = 
            new BABYLON.ActionManager(scene);
        this.addHighlightEffect();
        const tesseract = this.cube.tesseract;
        const cubeIndex = this.cube.cubeIndex;
        const faceIndex = this.faceIndex;
        actionMngr.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickDownTrigger, 
                (evt) => { tesseract.onFaceTouched(cubeIndex, faceIndex); }
            ));
        // this.addLabel(scene);
        
        return faceMesh;        
    }

    addHighlightEffect() {
        let actionMngr = this.mesh.actionManager;
        let material = this.mesh.material;
        let normalColor = this.mainColor;
        let highlightColor = this.highlightColor;
        actionMngr.registerAction(
            new BABYLON.InterpolateValueAction(
                BABYLON.ActionManager.OnPointerOverTrigger, 
                material, "diffuseColor", 
                highlightColor, 
                200));
        actionMngr.registerAction(
            new BABYLON.InterpolateValueAction(
                BABYLON.ActionManager.OnPointerOutTrigger, 
                material, "diffuseColor", 
                normalColor, 
                200)); 
    }
    addLabel(scene) {
        let label = BABYLON.MeshBuilder.CreatePlane(
            "label", {size:0.2}, scene);
        label.parent = this.mesh;
        label.position.y = 0.1;
        billboards.push(label);
            
        let adt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(label);                
        // label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        var text1 = new BABYLON.GUI.TextBlock();
        text1.text = this.getId();
        text1.color = this.linkedFace == null ? "white" : "orange";
        text1.fontSize = 600;
        text1.fontWeight = 800;
        text1.fontFamily = "Arial";
        adt.addControl(text1); 
    }
}

class TCube {
    constructor(tesseract, cubeIndex) {
        this.tesseract = tesseract;
        this.cubeIndex = cubeIndex;
        this.position = new BABYLON.Vector3();
        const cube = this;
        this.faces = [
            // pos(x,y,z) rotx, rotz
            [-1,0,0,0,1],
            [1,0,0,0,-1],
            [0,-1,0,0,2],
            [0,1,0,0,0],
            [0,0,-1,-1,0],
            [0,0,1,1,0]
        ].map((v,i) => {
            let face = new TFace(cube, i);
            
            face.position.set(v[0],v[1],v[2]);
            face.rot.x = v[3]*Math.PI/2;
            face.rot.z = v[4]*Math.PI/2;
            return face;
        })
    }

    createMeshes(scene) {
        const tesseract = this.tesseract;
        let cube = BABYLON.MeshBuilder.CreateBox(
            'a', {size:0.9}, 
            scene);
        cube.material = tesseract.innerCubeMaterial;
        cube.position.copyFrom(this.position);
        cube.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.mesh = cube;
        // var hl = new BABYLON.HighlightLayer("hl1", scene);                    

        this.faces.forEach(face => {
            let faceMesh = face.createMesh(scene);
            // hl.addMesh(faceMesh, BABYLON.Color3.Green());
        });
        
    }

    faceTouched(face) {
        console.log(face.linkedFace);
        if(face.linkedFace) {
            console.log(face.linkedFace.cube);
        }
        if(face.linkedFace && face.linkedFace.cube) {

            // console.log(face.cube.mesh.)
            let other = face.linkedFace;
            const V = BABYLON.Vector3;
            let p0 = V.TransformCoordinates(
                face.position,
                face.cube.mesh.getWorldMatrix());
            let p1 = V.TransformCoordinates(
                other.position,
                other.cube.mesh.getWorldMatrix());
            let p2 = V.TransformCoordinates(
                other.position.scale(1),
                other.cube.mesh.getWorldMatrix());
            let distance = V.Distance(p0,p1);
            console.log("Distance = " + distance)
            if(distance<0.01)
            {
                let c0 = face.cube.mesh.absolutePosition;
                let c1 = other.cube.mesh.absolutePosition;
                let center = V.Lerp(c0,c1,0.5);
                
                let d0 = c1.subtract(center);
                let d1 = p2.subtract(center);
                console.log(d0,d1);
                let axis = BABYLON.Vector3.Cross(d0,d1).normalize();
    
                console.log("center=" + center);
                console.log("axis=" + axis);
                console.log("d0 = " + d0);
                console.log("d1 = " + d1);
                
                let start = performance.now();
                let rot0 = other.cube.mesh.rotationQuaternion.clone();
                let rot1 = 
                    face.cube.mesh.rotationQuaternion.multiply(
                        face.linkedFaceQuaternion);

                let animate = () => {
                    let t = (performance.now() - start) * 0.005;
                    if(t>1.0)t=1.0;
                    let theta = t*Math.PI/2;
                    let p = center
                        .add(d0.scale(Math.cos(theta)))
                        .add(d1.scale(Math.sin(theta)));
                    
                    other.cube.mesh.position.copyFrom(p);
                    if(t<1.0) {
                        let q = 
                            BABYLON.Quaternion.RotationAxis(axis, theta).multiply(rot0);
                        other.cube.mesh.rotationQuaternion.copyFrom(q);    
                    }
                    else {
                        other.cube.mesh.rotationQuaternion.copyFrom(rot1);   
                    }
                    
                    if(t>=1.0) scene.unregisterBeforeRender(animate);
                    // console.log(t);
                }
                scene.registerBeforeRender(animate);
            } 
        
        }
    }
}

class Tesseract {
    constructor() {
        let pivot = this.pivot = new BABYLON.TransformNode();   
        const me = this;     
        let cubes = this.cubes = [
            [0,1,0],[0,0,0],[0,-1,0],[0,-2,0],
            [-1,0,0],[1,0,0],[0,0,-1],[0,0,1]
        ].map(([x,y,z],i) => {
            let cube = new TCube(me,i);
            cube.position.set(x,y,z);
            return cube;
        });
        this.linkFaces();
        let channelColors = [
            [1,0,0],[0,1,0],[0,0,1],[0,1,1],[1,0,1],[1,1,0]]
            .map(c => new BABYLON.Color3(...c));
        this.cubes.forEach(cube => {
            cube.faces.forEach(face => 
                face.setColor(channelColors[face.channel]))
        });
    }

    linkFaces() {
        const Q = BABYLON.Quaternion;
        const x90 = Q.RotationAxis(BABYLON.Axis.X, Math.PI/2);
        const y90 = Q.RotationAxis(BABYLON.Axis.Y, Math.PI/2);
        const z90 = Q.RotationAxis(BABYLON.Axis.Z, Math.PI/2);
        const x270 = Q.RotationAxis(BABYLON.Axis.X, -Math.PI/2);
        const y270 = Q.RotationAxis(BABYLON.Axis.Y, -Math.PI/2);
        const z270 = Q.RotationAxis(BABYLON.Axis.Z, -Math.PI/2);
        const x180 = Q.RotationAxis(BABYLON.Axis.X, Math.PI);
        const z180 = Q.RotationAxis(BABYLON.Axis.Z, Math.PI);
        const norot = Q.Identity();

        this.linkFace(0,1,5,3,z90,0);
        this.linkFace(0,4,6,3,x90,1);
        this.linkFace(0,0,4,3,z270,0);
        this.linkFace(0,5,7,3,x270,1);
        
        this.linkFace(2,1,5,2,z270,0);
        this.linkFace(2,4,6,2,x270,1);
        this.linkFace(2,0,4,2,z90,0);
        this.linkFace(2,5,7,2,x90,1);
        
        this.linkFace(0,2,1,3, norot,2);
        this.linkFace(1,2,2,3, norot,2);
        this.linkFace(2,2,3,3, norot,2);
        this.linkFace(3,2,0,3, norot,2);

        this.linkFace(1,1,5,0, norot,3);
        this.linkFace(1,4,6,5, norot,4);
        this.linkFace(1,0,4,1, norot,3);
        this.linkFace(1,5,7,4, norot,4);

        this.linkFace(6,1,5,4, y90, 5);
        this.linkFace(5,5,7,1, y90, 5);
        this.linkFace(7,0,4,5, y90, 5);
        this.linkFace(4,4,6,0, y90, 5);

        this.linkFace(6,4,3,4, x180, 4);
        this.linkFace(7,5,3,5, x180, 4);
        this.linkFace(4,0,3,0, z180, 3);
        this.linkFace(5,1,3,1, z180, 3);
        
    }

    linkFace(c0,f0,c1,f1, rot, channel) {
        rot = rot || BABYLON.Quaternion.Identity();
        let a = this.cubes[c0].faces[f0];
        let b = this.cubes[c1].faces[f1];
        this.cubes[c0].faces[f0].channel = channel;
        this.cubes[c1].faces[f1].channel = channel;
        
        if(a.linkedFace || b.linkedFace) throw "Already linked";
        a.linkedFace = b;
        a.linkedFaceQuaternion = rot;
        b.linkedFace = a;
        b.linkedFaceQuaternion = BABYLON.Quaternion.Inverse(rot);
    }

    createMeshes(scene) {
        this.createMaterials(scene);
        this.cubes.forEach(cube => cube.createMeshes(scene));
        this.moveToCenter();
    }

    createMaterials(scene) {
        let mat = this.innerCubeMaterial = new BABYLON.StandardMaterial(
            'innerCubeMat',
            scene);
        mat.diffuseColor.set(0.2,0.2,0.2);            
        mat = this.facesMaterial = new BABYLON.StandardMaterial(
            'facesMat',
            scene);
        mat.diffuseColor.set(0.8,0.2,0.2);
    }

    getCubeAt(p, maxDistance = 0.1) {
        let lst = this.cubes
            .map(c=>({
                cube:c,
                dist:BABYLON.Vector3.Distance(
                    p,c.mesh.absolutePosition)}))
            .filter(c=>c.dist<=maxDistance);
        if(lst.length>0) {
            if(lst.length==1) return lst[0].cube;
            else return lst.reduce(
                (a,b) => a.dist < b.dist ? a : b).cube;
        } 
        else return null;
    }

    // get the table of current cube connections
    // (two cubes are connected iff they touch each other)
    getCurrentLinks() {
        let tb = [];
        this.cubes.forEach(cube=>tb.push([]));
        this.cubes.forEach(cube => {
            cube.faces.forEach(face => {
                let otherFace = face.linkedFace;
                let otherCube = otherFace.cube;
                let dist = BABYLON.Vector3.Distance(
                    face.mesh.absolutePosition,
                    otherFace.mesh.absolutePosition
                );
                if(dist < 0.2) {
                    // we have a connection!
                    tb[cube.cubeIndex].push(otherCube.cubeIndex);
                }
            });
        });
        return tb;
    }

    moveToCenter() {
        let p = new BABYLON.Vector3(0,0,0);
        this.cubes.forEach(cube=>p.addInPlace(cube.mesh.absolutePosition));
        p.scaleInPlace(-1/8);
        this.cubes.forEach(cube=>cube.mesh.position.addInPlace(p));
    }
    onFaceTouched(cubeIndex, faceIndex) {
        console.log(cubeIndex, faceIndex);
        let controller = new CubeRotationController(this, cubeIndex, faceIndex);
        if(controller.valid) {
            let scene = this.pivot.getScene();
            let startTime = performance.now();
            const tesseract = this;
            let animate = () => {
                let t = (performance.now() - startTime) / 1000;
                if(t>=1) {
                    scene.unregisterBeforeRender(animate);
                    controller.finish();
                    tesseract.moveToCenter();
                } else {
                    controller.rotate(Math.PI/2 * t);
                }
            }
            scene.registerBeforeRender(animate);
        }
    }
} 


class CubeRotationController {
    constructor(tesseract, cubeIndex, faceIndex) {
        this.tesseract = tesseract;
        this.cubeIndex = cubeIndex;
        this.faceIndex = faceIndex;
        this.valid = false;
        this.computeParameters();
    }

    computeParameters() {
        const V = BABYLON.Vector3;
        let cube0 = this.cube0 = this.tesseract.cubes[this.cubeIndex];
        let face0 = this.face0 = cube0.faces[this.faceIndex];
        let face1 = this.face1 = face0.linkedFace;
        if(face1 == null) return;
        // cube1 is the moving cube
        let cube1 = this.cube1 = face1.cube;

        let p0 = V.TransformCoordinates(
                face0.position,
                cube0.mesh.getWorldMatrix());
        let p1 = V.TransformCoordinates(
                face1.position,
                cube1.mesh.getWorldMatrix());
        let distance = V.Distance(p0,p1);
        // console.log("Distance = " + distance)
        if(distance > 0.001) return;

        let p = V.Lerp(p0,p1,0.5);
        console.log("p="+p);

        let center = this.center = V.Lerp(
            cube0.mesh.absolutePosition,
            cube1.mesh.absolutePosition,
            0.5);
        console.log("center="+center);
        let cube2 = this.tesseract.getCubeAt(V.Lerp(p,center,2));
        console.log("cube2="+(cube2?cube2.cubeIndex:null));

        this.d0 = cube1.mesh.absolutePosition.subtract(center);
        let targetPos = V.TransformCoordinates(
            face1.position,
            cube1.mesh.getWorldMatrix());
        this.d1 = targetPos.subtract(center);

        this.startRotation = cube1.mesh.rotationQuaternion.clone();
        let finalRotation = this.finalRotation = 
            cube0.mesh.rotationQuaternion.multiply(
                face0.linkedFaceQuaternion);        
        
        let indices = this.getMovingCubesIndices(cube1.cubeIndex, cube2.cubeIndex);
        let inv = cube1.mesh.getWorldMatrix().clone().invert();
        this.items = indices
            .map(index => this.tesseract.cubes[index])
            .map(cube => ({
                cube: cube,
                matrix: cube.mesh.getWorldMatrix().multiply(inv)
                
        }));
        this.valid = true;

    }

    getMovingCubesIndices(cubeIndex, detachedCubeIndex) {
        let tb = this.tesseract.getCurrentLinks();
        let lst = [cubeIndex];
        let touched = {}
        touched[cubeIndex] = true
        touched[detachedCubeIndex] = true;
        let todo = [];
        tb[cubeIndex].forEach(d=>{if(!touched[d]) todo.push(d)});
        while(todo.length>0) {
            console.log(todo)
            let c = todo.pop();
            if(!touched[c]) {
                touched[c] = true;
                lst.push(c);
                console.log(c);
                tb[c].forEach(d=>{if(!touched[d]) todo.push(d)});              
            }
        }
        return lst;
    }

    rotate(theta) {
        if(!this.valid) return;
        let cube1 = this.cube1;
        let center = this.center;
        let axis = BABYLON.Vector3.Cross(this.d0,this.d1).normalize();
    
        let rotation = 
            BABYLON.Quaternion.RotationAxis(axis, theta)
            .multiply(this.startRotation);
        let p = this.center
            .add(this.d0.scale(Math.cos(theta)))
            .add(this.d1.scale(Math.sin(theta)))
        let matrix = BABYLON.Matrix.Compose(
                new BABYLON.Vector3(1,1,1),
                rotation,
                p
        );
        this.items.forEach(item => {
            let cube = item.cube;
            let v = new BABYLON.Vector3();
            let mat = item.matrix.multiply(matrix);
            mat.decompose(v,
                cube.mesh.rotationQuaternion,
                cube.mesh.position);
        });

        // cube1.mesh.rotationQuaternion.copyFrom(rotation);  
        // cube1.mesh.position.copyFrom(p);

    }
    finish() {
        if(!this.valid) return;
        let finalPos = this.center.add(this.d1);
        let finalRotation = this.finalRotation;
        let finalMatrix = BABYLON.Matrix.Compose(
            new BABYLON.Vector3(1,1,1),
            finalRotation,
            finalPos
        );

        this.items.forEach(item => {
            let cube = item.cube;
            let v = new BABYLON.Vector3();
            let mat = item.matrix.multiply(finalMatrix);
            mat.decompose(v,
                cube.mesh.rotationQuaternion,
                cube.mesh.position);
        });
        
        //cube1.mesh.rotationQuaternion.copyFrom(finalRotation);
        //cube1.mesh.position.copyFrom(center.add(d1));
    }
}