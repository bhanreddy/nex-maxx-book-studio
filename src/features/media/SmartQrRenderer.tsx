"use client";
import React, { memo, useEffect, useMemo, useState } from 'react';
import type { PageElement } from '../../domain/element/types';
import { smartQrScene, type SmartQrData, type QrArtifact } from '../../editor/media/smartQr';
import { PublicationSceneView } from '../../editor/renderer/PublicationSceneView';
import { curriculumRequest } from '../../editor/persistence/bookRepository';
const artifacts = new Map<string, Promise<QrArtifact>>();
export const SmartQrRenderer = memo(function SmartQrRenderer({ element }: {
    element: PageElement;
}) {
    const d = element.content.smartMediaQr as SmartQrData;
    const [artifact, setArtifact] = useState<QrArtifact | undefined>(d?.renderArtifact);
    useEffect(() => {
        let cancelled = false;
        setArtifact(d?.renderArtifact);
        if (!d?.qrId)
            return;
        if (!artifacts.has(d.qrId)) {
            if (artifacts.size >= 100)
                artifacts.delete(artifacts.keys().next().value!);
            artifacts.set(d.qrId, curriculumRequest<{
                artifact: QrArtifact;
            }>(`media/qr/${encodeURIComponent(d.qrId)}/artifact`, 'GET').then(r => r.artifact).catch(e => { artifacts.delete(d.qrId); throw e; }));
        }
        artifacts.get(d.qrId)!.then(a => { if (!cancelled)
            setArtifact(a); }).catch(() => { });
        return () => { cancelled = true; };
    }, [d?.qrId, d?.renderArtifact]);
    const scene = useMemo(() => smartQrScene({ ...element, content: { smartMediaQr: { ...d, renderArtifact: artifact } } }), [element.transform.width, element.transform.height, d, artifact]);
    return <PublicationSceneView scene={scene} label={`${d.label}. ${d.description}. ${d.cta}`}/>;
});
