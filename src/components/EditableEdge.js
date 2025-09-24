import React, { useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from 'reactflow';

const EditableEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  const [weight, setWeight] = useState(data?.weight || 1);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt) => {
    evt.stopPropagation();
    setIsEditing(true);
  };

  const onLabelChange = useCallback((evt) => {
    setLabel(evt.target.value);
  }, []);

  const onWeightChange = useCallback((evt) => {
    setWeight(parseFloat(evt.target.value) || 1);
  }, []);

  const onSave = useCallback(() => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: { 
              ...edge.data, 
              label, 
              weight,
            },
            label: label || undefined,
            style: {
              ...edge.style,
              strokeWidth: Math.max(1, weight * 2),
            },
          };
        }
        return edge;
      })
    );
    setIsEditing(false);
  }, [id, label, weight, setEdges]);

  const onCancel = useCallback(() => {
    setLabel(data?.label || '');
    setWeight(data?.weight || 1);
    setIsEditing(false);
  }, [data]);

  const onDelete = useCallback(() => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  }, [id, setEdges]);

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: Math.max(1, weight * 2),
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <div className="edge-edit-panel">
              <div className="edge-edit-inputs">
                <input
                  type="text"
                  value={label}
                  onChange={onLabelChange}
                  placeholder="Connection label"
                  className="edge-label-input"
                />
                <input
                  type="number"
                  value={weight}
                  onChange={onWeightChange}
                  min="0.1"
                  max="5"
                  step="0.1"
                  placeholder="Weight"
                  className="edge-weight-input"
                />
              </div>
              <div className="edge-edit-buttons">
                <button onClick={onSave} className="edge-save-btn">✓</button>
                <button onClick={onCancel} className="edge-cancel-btn">✕</button>
                <button onClick={onDelete} className="edge-delete-btn">🗑</button>
              </div>
            </div>
          ) : (
            <div 
              className="edge-label-display"
              onClick={onEdgeClick}
            >
              {label && <span className="edge-label-text">{label}</span>}
              {weight !== 1 && <span className="edge-weight-text">({weight})</span>}
              <span className="edge-edit-hint">✏️</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default EditableEdge;