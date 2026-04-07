import Mux from "@mux/mux-node";

export class MuxService {
  private mux: Mux;

  constructor() {
    const muxTokenId = process.env.MUX_TOKEN_ID;
    const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!muxTokenId || !muxTokenSecret) {
      throw new Error("Mux credentials not configured");
    }

    this.mux = new Mux({
      tokenId: muxTokenId,
      tokenSecret: muxTokenSecret,
    });
  }

  /**
   * Create a new live stream
   */
  async createLiveStream(title: string) {
    try {
      const stream = await this.mux.video.liveStreams.create({
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
          mp4_support: "standard",
        },
        latency_mode: "low",
        test: false,
      });

      return {
        muxStreamId: stream.id,
        muxPlaybackId: stream.playback_ids?.[0]?.id,
        streamKey: stream.stream_key,
        rtmpUrl: `rtmp://global-live.mux.com:5222/app`,
        status: "created",
      };
    } catch (error) {
      console.error("Error creating Mux live stream:", error);
      throw new Error("Failed to create live stream");
    }
  }

  /**
   * Get live stream status
   */
  async getLiveStreamStatus(muxStreamId: string) {
    try {
      const stream = await this.mux.video.liveStreams.retrieve(muxStreamId);
      return {
        status: stream.status,
        playbackId: stream.playback_ids?.[0]?.id,
        activeAssetId: stream.active_asset_id,
        recentAssetIds: stream.recent_asset_ids,
      };
    } catch (error) {
      console.error("Error getting stream status:", error);
      throw new Error("Failed to get stream status");
    }
  }

  /**
   * Start a live stream
   */
  async startLiveStream(muxStreamId: string) {
    try {
      await this.mux.video.liveStreams.start(muxStreamId);
      return { success: true };
    } catch (error) {
      console.error("Error starting live stream:", error);
      throw new Error("Failed to start live stream");
    }
  }

  /**
   * Stop a live stream
   */
  async stopLiveStream(muxStreamId: string) {
    try {
      await this.mux.video.liveStreams.stop(muxStreamId);
      return { success: true };
    } catch (error) {
      console.error("Error stopping live stream:", error);
      throw new Error("Failed to stop live stream");
    }
  }

  /**
   * Delete a live stream
   */
  async deleteLiveStream(muxStreamId: string) {
    try {
      await this.mux.video.liveStreams.del(muxStreamId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting live stream:", error);
      throw new Error("Failed to delete live stream");
    }
  }

  /**
   * Get playback URL for a stream
   */
  getPlaybackUrl(muxPlaybackId: string) {
    return `https://stream.mux.com/${muxPlaybackId}.m3u8`;
  }

  /**
   * Get thumbnail URL for a stream
   */
  getThumbnailUrl(muxPlaybackId: string, time?: number) {
    const timeParam = time ? `?time=${time}` : "";
    return `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg${timeParam}`;
  }

  /**
   * Create a video on-demand asset
   */
  async createVODAsset(inputUrl: string, title: string) {
    try {
      const asset = await this.mux.video.assets.create({
        input: [{ url: inputUrl }],
        playback_policy: ["public"],
        mp4_support: "standard",
        test: false,
      });

      return {
        assetId: asset.id,
        playbackId: asset.playback_ids?.[0]?.id,
        status: asset.status,
      };
    } catch (error) {
      console.error("Error creating VOD asset:", error);
      throw new Error("Failed to create VOD asset");
    }
  }

  /**
   * Get asset status
   */
  async getAssetStatus(assetId: string) {
    try {
      const asset = await this.mux.video.assets.retrieve(assetId);
      return {
        status: asset.status,
        playbackId: asset.playback_ids?.[0]?.id,
        duration: asset.duration,
        mp4Support: asset.mp4_support,
      };
    } catch (error) {
      console.error("Error getting asset status:", error);
      throw new Error("Failed to get asset status");
    }
  }

  /**
   * Handle webhook events from Mux
   */
  handleWebhookEvent(event: any) {
    const { type, data } = event;

    switch (type) {
      case "video.live_stream.active":
        // Stream went live
        return {
          type: "stream_started",
          streamId: data.id,
          playbackId: data.playback_ids?.[0]?.id,
        };

      case "video.live_stream.idle":
        // Stream stopped
        return {
          type: "stream_ended",
          streamId: data.id,
        };

      case "video.asset.ready":
        // VOD asset is ready
        return {
          type: "vod_ready",
          assetId: data.id,
          playbackId: data.playback_ids?.[0]?.id,
          duration: data.duration,
        };

      default:
        return {
          type: "unknown",
          eventType: type,
          data,
        };
    }
  }
}

// Export singleton instance
export const muxService = new MuxService();
