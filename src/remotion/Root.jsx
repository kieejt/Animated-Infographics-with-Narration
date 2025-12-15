import { Composition, calculateMetadata } from 'remotion';
import MyComposition from './MyComposition.jsx';

export const RemotionRoot = () => {
    return (
        <>
            <Composition
                id="Infographic"
                component={MyComposition}
                fps={30}
                width={1920}
                height={1080} // 16:9 Landscape
                calculateMetadata={({ props }) => {
                    // Tính duration động từ tracks và audioUrls
                    const { tracks = [], audioUrls = [] } = props || {};
                    
                    // Tính duration từ tracks
                    let trackDuration = 0;
                    if (tracks && tracks.length > 0) {
                        trackDuration = Math.max(
                            ...tracks.map(track => 
                                track.scenes?.reduce((acc, scene) => 
                                    acc + (scene.duration || 5) * 30, 0
                                ) || 0
                            )
                        );
                    }
                    
                    // Tính duration từ audioUrls
                    let audioDuration = 0;
                    if (audioUrls && audioUrls.length > 0) {
                        audioDuration = audioUrls.reduce((acc, segment) => 
                            acc + Math.ceil((segment.durationInSeconds || 0) * 30), 0
                        );
                    }
                    
                    // Lấy duration lớn nhất giữa tracks và audio
                    const totalDuration = Math.max(trackDuration, audioDuration, 300); // minimum 10 seconds
                    
                    return {
                        durationInFrames: totalDuration,
                    };
                }}
            />
        </>
    );
};
