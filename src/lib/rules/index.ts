// ── Original 9 exercises ──────────────────────────────────────────────────────
export { analyzeSquat }           from './squat';
export { analyzePushup }          from './pushup';
export { analyzePlank }           from './plank';
export { analyzeLunge }           from './lunge';
export { analyzeGluteBridge }     from './glute_bridge';
export { analyzeSidePlank }       from './side_plank';
export { analyzeSuperman }        from './superman';
export { analyzeMountainClimber } from './mountain_climber';
export { analyzeBurpee }          from './burpee';

// ── New exercises — legs / glutes ─────────────────────────────────────────────
export { analyzeJumpSquat }       from './jump_squat';
export { analyzeSumoSquat }       from './sumo_squat';
export { analyzeDonkeyKick }      from './donkey_kick';
export { analyzeFireHydrant }     from './fire_hydrant';
export { analyzeHipThrust }       from './hip_thrust';
export { analyzeWallSit }         from './wall_sit';

// ── New exercises — core ──────────────────────────────────────────────────────
export { analyzeCrunch }          from './crunch';
export { analyzeBicycleCrunch }   from './bicycle_crunch';
export { analyzeLegRaise }        from './leg_raise';
export { analyzeRussianTwist }    from './russian_twist';
export { analyzeDeadBug }         from './dead_bug';
export { analyzeBirdDog }         from './bird_dog';
export { analyzeFlutterKick }     from './flutter_kick';

// ── New exercises — push ──────────────────────────────────────────────────────
export { analyzePikePushup }      from './pike_pushup';
export { analyzeDiamondPushup }   from './diamond_pushup';
export { analyzeWidePushup }      from './wide_pushup';
export { analyzeTricepDip }       from './tricep_dip';

// ── New exercises — full body ─────────────────────────────────────────────────
export { analyzeHighKnees }       from './high_knees';
export { analyzeBearCrawl }       from './bear_crawl';
export { analyzeInchworm }        from './inchworm';

// ── Types ─────────────────────────────────────────────────────────────────────
export type { ExerciseResult, SquatPhase, ErrorTracker } from './squat';
export type { PushupPhase }                               from './pushup';
export type { PlankResult }                               from './plank';
export type { LungePhase }                                from './lunge';
export type { GluteBridgePhase }                          from './glute_bridge';
export type { SidePlankResult }                           from './side_plank';
export type { SupermanResult }                            from './superman';
export type { MountainClimberPhase }                      from './mountain_climber';
export type { BurpeePhase }                               from './burpee';
export type { JumpSquatPhase }                            from './jump_squat';
export type { SumoSquatPhase }                            from './sumo_squat';
export type { DonkeyKickPhase }                           from './donkey_kick';
export type { FireHydrantPhase }                          from './fire_hydrant';
export type { HipThrustPhase }                            from './hip_thrust';
export type { WallSitPhase }                              from './wall_sit';
export type { CrunchPhase }                               from './crunch';
export type { BicycleCrunchPhase }                        from './bicycle_crunch';
export type { LegRaisePhase }                             from './leg_raise';
export type { RussianTwistPhase }                         from './russian_twist';
export type { DeadBugPhase }                              from './dead_bug';
export type { BirdDogPhase }                              from './bird_dog';
export type { FlutterKickPhase }                          from './flutter_kick';
export type { PikePushupPhase }                           from './pike_pushup';
export type { DiamondPushupPhase }                        from './diamond_pushup';
export type { WidePushupPhase }                           from './wide_pushup';
export type { TricepDipPhase }                            from './tricep_dip';
export type { HighKneesPhase }                            from './high_knees';
export type { BearCrawlPhase }                            from './bear_crawl';
export type { InchwormPhase }                             from './inchworm';
