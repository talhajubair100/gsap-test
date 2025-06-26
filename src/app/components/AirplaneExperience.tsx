"use client";
import React, { useEffect } from "react";
import type { WebGLRenderer, Scene as ThreeScene, Group, PerspectiveCamera, Mesh, Material, Object3D, BufferGeometry } from "three";

// Define a type for the view objects
interface View {
    bottom: number;
    height: number;
    camera?: PerspectiveCamera;
}

const AirplaneExperience = () => {
    useEffect(() => {
        let renderer: WebGLRenderer | undefined, scene: ThreeScene | undefined, modelGroup: Group | undefined, animationFrameId: number;
        const views: View[] = [
            { bottom: 0, height: 1 },
            { bottom: 0, height: 0 },
        ];
        let w = window.innerWidth;
        let h = window.innerHeight;

        async function loadModel() {
            const THREE = await import("three");
            const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
            const gsap = (await import("gsap")).default;
            const { ScrollTrigger } = await import("gsap/ScrollTrigger");
            gsap.registerPlugin(ScrollTrigger);

            let object: Group | undefined;
            function onModelLoaded() {
                object!.traverse(function (child: Object3D) {
                    if ((child as Mesh).isMesh) {
                        const mat = new THREE.MeshPhongMaterial({
                            color: 0x171511,
                            specular: 0xd0cbc7,
                            shininess: 5,
                            flatShading: true,
                        });
                        (child as Mesh).material = mat as Material;
                    }
                });
                setupAnimation(object!, THREE, gsap);
            }
            const manager = new THREE.LoadingManager(onModelLoaded);
            const loader = new OBJLoader(manager);
            loader.load(
                "https://assets.codepen.io/557388/1405+Plane_1.obj",
                function (obj: Group) {
                    object = obj;
                }
            );
        }

        function setMaterialProps(material: Material | Material[], props: Partial<Material>) {
            if (Array.isArray(material)) {
                material.forEach(mat => Object.assign(mat, props));
            } else {
                Object.assign(material, props);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function setupAnimation(model: Group, THREE: typeof import("three"), gsap: any) {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.domElement.style.position = "fixed";
            renderer.domElement.style.top = "0";
            renderer.domElement.style.left = "0";
            renderer.domElement.style.zIndex = "2";
            renderer.domElement.style.pointerEvents = "none";
            document.body.appendChild(renderer.domElement);

            scene = new THREE.Scene();
            for (let ii = 0; ii < views.length; ++ii) {
                const view = views[ii];
                const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
                camera.position.fromArray([0, 0, 180]);
                camera.layers.disableAll();
                camera.layers.enable(ii);
                view.camera = camera;
                camera.lookAt(new THREE.Vector3(0, 5, 0));
            }
            const light = new THREE.PointLight(0xffffff, 0.75);
            light.position.z = 150;
            light.position.x = 70;
            light.position.y = -20;
            scene.add(light);
            const softLight = new THREE.AmbientLight(0xffffff, 1.5);
            scene.add(softLight);
            const meshChild = model.children[0] as Mesh<BufferGeometry, Material>;
            const edges = new THREE.EdgesGeometry(meshChild.geometry);
            const line = new THREE.LineSegments(edges);
            setMaterialProps(line.material, { depthTest: false, opacity: 0.5, transparent: true });
            line.position.x = 0.5;
            line.position.z = -1;
            line.position.y = 0.2;
            modelGroup = new THREE.Group();
            model.layers.set(0);
            line.layers.set(1);
            modelGroup.add(model);
            modelGroup.add(line);
            scene.add(modelGroup);
            onResize();
            window.addEventListener("resize", onResize, false);
            function render() {
                for (let ii = 0; ii < views.length; ++ii) {
                    const view = views[ii];
                    const camera = view.camera!;
                    const bottom = Math.floor(h * view.bottom);
                    const height = Math.floor(h * view.height);
                    renderer!.setViewport(0, 0, w, h);
                    renderer!.setScissor(0, bottom, w, height);
                    renderer!.setScissorTest(true);
                    camera.aspect = w / h;
                    renderer!.render(scene!, camera);
                }
            }
            function onResize() {
                w = window.innerWidth;
                h = window.innerHeight;
                for (let ii = 0; ii < views.length; ++ii) {
                    const view = views[ii];
                    const camera = view.camera!;
                    camera.aspect = w / h;
                    const camZ = (screen.width - w * 1) / 3;
                    camera.position.z = camZ < 180 ? 180 : camZ;
                    camera.updateProjectionMatrix();
                }
                renderer!.setSize(w, h);
                render();
            }
            gsap.fromTo(
                "canvas",
                { x: "50%", autoAlpha: 0 },
                { duration: 1, x: "0%", autoAlpha: 1 }
            );
            gsap.to(".loading", { autoAlpha: 0 });
            gsap.to(".scroll-cta", { opacity: 1 });
            gsap.set("svg", { autoAlpha: 1 });
            const tau = Math.PI * 2;
            gsap.set(modelGroup.rotation, { y: tau * -0.25 });
            gsap.set(modelGroup.position, { x: 80, y: -32, z: -60 });
            render();
            const sectionDuration = 1;
            gsap.fromTo(
                views[1],
                { height: 1, bottom: 0 },
                {
                    height: 0,
                    bottom: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".blueprint",
                        scrub: true,
                        start: "bottom bottom",
                        end: "bottom top",
                    },
                }
            );
            gsap.fromTo(
                views[1],
                { height: 0, bottom: 0 },
                {
                    height: 1,
                    bottom: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".blueprint",
                        scrub: true,
                        start: "top bottom",
                        end: "top top",
                    },
                }
            );
            gsap.to(".ground", {
                y: "30%",
                scrollTrigger: {
                    trigger: ".ground-container",
                    scrub: true,
                    start: "top bottom",
                    end: "bottom top",
                },
            });
            gsap.from(".clouds", {
                y: "25%",
                scrollTrigger: {
                    trigger: ".ground-container",
                    scrub: true,
                    start: "top bottom",
                    end: "bottom top",
                },
            });
            gsap.to("#line-length", {
                opacity: 1,
                scrollTrigger: {
                    trigger: ".length",
                    scrub: true,
                    start: "top bottom",
                    end: "top top",
                },
            });
            gsap.to("#line-wingspan", {
                opacity: 1,
                scrollTrigger: {
                    trigger: ".wingspan",
                    scrub: true,
                    start: "top 25%",
                    end: "bottom 50%",
                },
            });
            gsap.to("#circle-phalange", {
                opacity: 1,
                scrollTrigger: {
                    trigger: ".phalange",
                    scrub: true,
                    start: "top 50%",
                    end: "bottom 100%",
                },
            });
            gsap.to("#line-length", {
                opacity: 0,
                scrollTrigger: {
                    trigger: ".length",
                    scrub: true,
                    start: "top top",
                    end: "bottom top",
                },
            });
            gsap.to("#line-wingspan", {
                opacity: 0,
                scrollTrigger: {
                    trigger: ".wingspan",
                    scrub: true,
                    start: "top top",
                    end: "bottom top",
                },
            });
            gsap.to("#circle-phalange", {
                opacity: 0,
                scrollTrigger: {
                    trigger: ".phalange",
                    scrub: true,
                    start: "top top",
                    end: "bottom top",
                },
            });
            const tl = gsap.timeline({
                onUpdate: render,
                scrollTrigger: {
                    trigger: ".content",
                    scrub: true,
                    start: "top top",
                    end: "bottom bottom",
                },
                defaults: { duration: sectionDuration, ease: "power2.inOut" },
            });
            // Timeline animation steps
            const timelineSteps = [
                // [target, vars, delayIncrement]
                [".scroll-cta", { duration: 0.25, opacity: 0 }, 0],
                [modelGroup.position, { x: -10, ease: "power1.in" }, 0],
                [modelGroup.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.05, ease: "power1.inOut" }, 1],
                [modelGroup.position, { x: -40, y: 0, z: -60, ease: "power1.inOut" }, 0],
                [modelGroup.rotation, { x: tau * 0.25, y: 0, z: tau * 0.05, ease: "power3.inOut" }, 1],
                [modelGroup.position, { x: 40, y: 0, z: -60, ease: "power2.inOut" }, 0],
                [modelGroup.rotation, { x: tau * 0.2, y: 0, z: -tau * 0.1, ease: "power3.inOut" }, 1],
                [modelGroup.position, { x: -40, y: 0, z: -30, ease: "power2.inOut" }, 0],
                [modelGroup.rotation, { x: 0, z: 0, y: tau * 0.25 }, 1],
                [modelGroup.position, { x: 0, y: -10, z: 50 }, 0],
                [modelGroup.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: "power4.inOut" }, 2],
                [modelGroup.position, { z: 30, ease: "power4.inOut" }, 0],
                [modelGroup.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: "power4.inOut" }, 1],
                [modelGroup.position, { z: 60, x: 30, ease: "power4.inOut" }, 0],
                [modelGroup.rotation, { x: tau * 0.35, y: tau * 0.75, z: tau * 0.6, ease: "power4.inOut" }, 1],
                [modelGroup.position, { z: 100, x: 20, y: 0, ease: "power4.inOut" }, 0],
                [modelGroup.rotation, { x: tau * 0.15, y: tau * 0.85, z: -tau * 0, ease: "power1.in" }, 1],
                [modelGroup.position, { z: -150, x: 0, y: 0, ease: "power1.inOut" }, 0],
                [modelGroup.rotation, { duration: sectionDuration, x: -tau * 0.05, y: tau, z: -tau * 0.1, ease: "none" }, 1],
                [modelGroup.position, { duration: sectionDuration, x: 0, y: 30, z: 320, ease: "power1.in" }, 0],
                [light.position, { duration: sectionDuration, x: 0, y: 0, z: 0 }, 0],
            ];
            let delay = 0;
            for (const [target, vars, delayIncrement] of timelineSteps) {
                tl.to(target, vars, delay);
                delay += (delayIncrement as number) * sectionDuration;
            }
            function animate() {
                render();
                animationFrameId = requestAnimationFrame(animate);
            }
            animate();
        }
        loadModel();
        return () => {
            if (renderer && renderer.domElement) {
                renderer.domElement.remove();
            }
            window.removeEventListener("resize", () => { });
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="content">
            <div className="loading">Loading</div>
            <div className="trigger"></div>
            <div className="section">
                <h1>Airplanes.</h1>
                <h3>The beginners guide.</h3>
                <p>You&apos;ve probably forgotten what these are.</p>
                {/* <div className="phonetic">/ ˈɛərˌpleɪn /</div> */}
                <div className="scroll-cta">Scroll</div>
            </div>
            <div className="section right">
                <h2>They&apos;re kinda like buses...</h2>
            </div>
            <div className="ground-container">
                <div className="parallax ground"></div>
                <div className="section right">
                    <h2>..except they leave the ground.</h2>
                    <p>Saaay what!?.</p>
                </div>
                <div className="section">
                    <h2>They fly through the sky.</h2>
                    <p>For realsies!</p>
                </div>
                <div className="section right">
                    <h2>Defying all known physical laws.</h2>
                    <p>It&apos;s actual magic!</p>
                </div>
                <div className="parallax clouds"></div>
            </div>
            <div className="blueprint">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <line id="line-length" x1="10" y1="80" x2="90" y2="80" strokeWidth="0.5" />
                    <path id="line-wingspan" d="M10 50, L40 35, M60 35 L90 50" strokeWidth="0.5" />
                    <circle id="circle-phalange" cx="60" cy="60" r="15" fill="transparent" strokeWidth="0.5" />
                </svg>
                <div className="section dark ">
                    <h2>The facts and figures.</h2>
                    <p>Lets get into the nitty gritty...</p>
                </div>
                <div className="section dark length">
                    <h2>Length.</h2>
                    <p>Long.</p>
                </div>
                <div className="section dark wingspan">
                    <h2>Wing Span.</h2>
                    <p>I dunno, longer than a cat probably.</p>
                </div>
                <div className="section dark phalange">
                    <h2>Left Phalange</h2>
                    <p>Missing</p>
                </div>
                <div className="section dark">
                    <h2>Engines</h2>
                    <p>Turbine funtime</p>
                </div>
                {/* <div className="section"></div> */}
            </div>
            <div className="sunset">
                <div className="section"></div>
                <div className="section end">
                    <h2>Fin.</h2>
                    <ul className="credits">
                        <li>
                            Plane model by {" "}
                            <a href="https://poly.google.com/view/8ciDd9k8wha" target="_blank" rel="noopener noreferrer">
                                Google
                            </a>
                        </li>
                        <li>
                            Designed by {" "}
                            <a href="https://github.com/Talhajubair100" target="_blank" rel="noopener noreferrer">
                                Talha Jubair
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AirplaneExperience; 