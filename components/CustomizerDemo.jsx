'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';

function URLImage({ image, isSelected, onSelect, onChange }) {
  const imgRef = useRef();
  const trRef = useRef();
  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([imgRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  return (
    <>
      <KonvaImage
        image={image}
        ref={imgRef}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => { onChange({ x: e.target.x(), y: e.target.y() }); }}
        onTransformEnd={(e) => {
          const node = imgRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({ x: node.x(), y: node.y(), width: Math.max(5, node.width() * scaleX), height: Math.max(5, node.height() * scaleY), rotation: node.rotation() });
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) return oldBox;
          return newBox;
        }} />
      )}
    </>
  );
}

function DraggableText({ textConfig, isSelected, onSelect, onChange }) {
  const textRef = useRef();
  const trRef = useRef();
  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  return (
    <>
      <KonvaText
        text={textConfig.text}
        x={textConfig.x}
        y={textConfig.y}
        fontSize={textConfig.fontSize}
        fontFamily={textConfig.fontFamily}
        draggable
        rotation={textConfig.rotation || 0}
        ref={textRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = textRef.current;
          const scaleX = node.scaleX();
          node.scaleX(1);
          onChange({ x: node.x(), y: node.y(), fontSize: Math.max(8, Math.round(node.fontSize() * scaleX)), rotation: node.rotation() });
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} rotateEnabled enabledAnchors={['middle-left','middle-right']} boundBoxFunc={(oldBox, newBox) => newBox} />
      )}
    </>
  );
}

export default function CustomizerDemo() {
  const stageRef = useRef();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasSize] = useState({ width: 800, height: 800 });
  const fileInputRef = useRef();

  const loadImageFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  const handleAddImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('File too large. Max 20MB.'); return; }
    try {
      const img = await loadImageFromFile(file);
      const id = `img_${Date.now()}`;
      const aspect = img.width / img.height;
      const maxSize = Math.min(canvasSize.width, canvasSize.height) * 0.6;
      let width = maxSize;
      let height = width / aspect;
      if (height > maxSize) { height = maxSize; width = height * aspect; }
      setUploadedImages((prev) => [...prev, { id, img, x: (canvasSize.width - width) / 2, y: (canvasSize.height - height) / 2, width, height, rotation: 0 }]);
      setSelectedId(id);
      fileInputRef.current.value = null;
    } catch (err) { console.error(err); alert('Failed to load image'); }
  };

  const handleAddText = () => {
    const id = `txt_${Date.now()}`;
    setTexts((prev) => [...prev, { id, text: 'Your text', x: canvasSize.width/2 - 60, y: canvasSize.height/2 - 10, fontSize: 28, fontFamily: 'Arial', rotation: 0 }]);
    setSelectedId(id);
  };

  const handleExportPNG = () => {
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const deselect = (e) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const updateImageProps = (id, props) => setUploadedImages((prev) => prev.map((p) => (p.id === id ? { ...p, ...props } : p)));
  const updateTextProps = (id, props) => setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...props } : t)));

  const removeSelected = () => {
    if (!selectedId) return;
    setUploadedImages((prev) => prev.filter((p) => p.id !== selectedId));
    setTexts((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-lg p-4 shadow">
        <h3 className="font-semibold">Customizer</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload image</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddImage} className="mt-2 block w-full text-sm" />
          </div>
          <div>
            <button onClick={handleAddText} className="px-3 py-2 bg-indigo-600 text-white rounded">Add text</button>
            <button onClick={removeSelected} className="ml-2 px-3 py-2 border rounded">Remove selected</button>
          </div>
          <div className="mt-4">
            <button onClick={handleExportPNG} className="px-3 py-2 bg-green-600 text-white rounded">Download PNG</button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">Product mockup</div>
          <div className="text-sm text-gray-600">Canvas: {canvasSize.width} x {canvasSize.height}px</div>
        </div>

        <div className="border rounded p-3 bg-gray-100 flex justify-center">
          <Stage width={canvasSize.width} height={canvasSize.height} ref={stageRef} onMouseDown={deselect} style={{ borderRadius: 8 }}>
            <Layer>
              {uploadedImages.map((item) => (
                <URLImage key={item.id} image={item.img} isSelected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} onChange={(props) => updateImageProps(item.id, props)} />
              ))}
              {texts.map((t) => (
                <DraggableText key={t.id} textConfig={t} isSelected={selectedId === t.id} onSelect={() => setSelectedId(t.id)} onChange={(props) => updateTextProps(t.id, props)} />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
