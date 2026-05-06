import React from 'react';
import { PhysarumPreview } from './PhysarumPreview.jsx';
import { BoidsPreview } from './BoidsPreview.jsx';
import { FlowFieldPreview } from './FlowFieldPreview.jsx';
import { CirclePackingPreview } from './CirclePackingPreview.jsx';
import { WavePreview } from './WavePreview.jsx';
import { LorenzPreview } from './LorenzPreview.jsx';
import { GameOfLifePreview } from './GameOfLifePreview.jsx';
import { GenericPreview } from './GenericPreview.jsx';
import {
  ImagePreview,
  TitlePreview,
  ParagraphPreview,
  ButtonPreview,
  ContainerPreview,
  LinePreview,
  GalleryPreview,
  MenuPreview,
  ShapePreview,
  RepeaterPreview,
  VideoPreview,
  IFramePreview,
} from './ElementPreviews.jsx';

export function PreviewRegistry({ id, width, height, props, elementId, fontScale }) {
  switch (id) {
    case 'image':
      return <ImagePreview width={width} height={height} props={props} elementId={elementId} />;
    case 'title':
      return <TitlePreview width={width} height={height} props={props} fontScale={fontScale} />;
    case 'paragraph':
      return <ParagraphPreview width={width} height={height} props={props} fontScale={fontScale} />;
    case 'text':
      return <ParagraphPreview width={width} height={height} props={props} fontScale={fontScale} />;
    case 'button':
      return <ButtonPreview width={width} height={height} props={props} fontScale={fontScale} />;
    case 'container':
      return <ContainerPreview width={width} height={height} props={props} />;
    case 'line':
      return <LinePreview width={width} height={height} />;
    case 'gallery':
      return <GalleryPreview width={width} height={height} />;
    case 'menu':
      return <MenuPreview width={width} height={height} />;
    case 'shape':
      return <ShapePreview width={width} height={height} />;
    case 'repeater':
      return <RepeaterPreview width={width} height={height} />;
    case 'video':
      return <VideoPreview width={width} height={height} />;
    case 'iframe':
      return <IFramePreview width={width} height={height} />;

    // Generative algorithm previews
    case 'physarum':
      return <PhysarumPreview width={width} height={height} />;
    case 'boids':
      return <BoidsPreview width={width} height={height} />;
    case 'flowfield':
      return <FlowFieldPreview width={width} height={height} />;
    case 'circlePacking':
      return <CirclePackingPreview width={width} height={height} />;
    case 'waveInterference':
      return <WavePreview width={width} height={height} />;
    case 'lorenz':
      return <LorenzPreview width={width} height={height} />;
    case 'gameOfLife':
      return <GameOfLifePreview width={width} height={height} />;
    default:
      return <GenericPreview algorithm={id} width={width} height={height} />;
  }
}
