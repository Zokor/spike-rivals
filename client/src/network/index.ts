export { ColyseusClient, colyseusClient } from './colyseus-client';
export {
  PredictionManager,
  createPredictionManager,
  type InputSnapshot,
  type ServerStateSnapshot,
  type PredictionConfig,
} from './prediction-manager';
export {
  Interpolator,
  PlayerInterpolator,
  BallInterpolator,
  NetworkStateManager,
  createInterpolator,
  createPlayerInterpolator,
  createBallInterpolator,
  createNetworkStateManager,
  type EntityState,
  type PlayerEntityState,
  type BallEntityState,
  type StateSnapshot,
  type InterpolatorConfig,
  type NetworkStateManagerConfig,
} from './interpolator';
