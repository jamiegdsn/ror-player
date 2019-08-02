import "./pattern-placeholder.scss";
import Component from "vue-class-component";
import template from "./pattern-placeholder.vue";
import Vue from "vue";
import Beatbox from "beatbox.js";
import { createPattern, getPatternFromState, State } from "../../state/state";
import { InjectReactive, Prop, Watch } from "vue-property-decorator";
import {
	BeatboxReference,
	createBeatbox,
	getPlayerById,
	patternToBeatbox,
	stopAllPlayers
} from "../../services/player";
import $ from "jquery";
import { normalizePlaybackSettings, PlaybackSettings } from "../../state/playbackSettings";
import config from "../../config";
import defaultTunes from "../../defaultTunes";
import { patternEquals } from "../../state/pattern";
import patternPlaceholderItemTemplate from "./pattern-placeholder-item.vue";
import events from "../../services/events";
import { DragType, PatternDragData, setDragData } from "../../services/draggable";
import PatternEditorDialog from "../pattern-editor-dialog/pattern-editor-dialog";
import { id } from "../../utils";

@Component({
	template: patternPlaceholderItemTemplate
})
export class PatternPlaceholderItem extends Vue {
}


@Component({
	template,
	components: { PatternEditorDialog }
})
export default class PatternPlaceholder extends Vue {
	@InjectReactive() readonly state!: State;

	@Prop({ type: String, required: true }) readonly tuneName!: string;
	@Prop({ type: String, required: true }) readonly patternName!: string;
	@Prop({ type: Boolean, default: false }) readonly readonly!: boolean;
	@Prop(Object) readonly settings?: PlaybackSettings;
	@Prop({ type: Boolean, default: false }) readonly draggable!: boolean;
	@Prop({ type: String, default: "copy" }) readonly dragEffect!: string;

	playerRef: BeatboxReference | null = null;
	editorId: string | null = null;

	get player() {
		return this.playerRef && getPlayerById(this.playerRef.id);
	}

	get pattern() {
		return getPatternFromState(this.state, this.tuneName, this.patternName);
	}

	get playbackSettings() {
		if(this.settings)
			return this.settings;

		const pattern = this.pattern;
		return normalizePlaybackSettings(Object.assign({}, this.state.playbackSettings, pattern && {
			speed: pattern.speed,
			loop: pattern.loop
		}));
	}

	get hasLocalChanges() {
		const original = defaultTunes.getPattern(this.tuneName, this.patternName);
		const current = this.pattern;

		return original && current && !patternEquals(original, current);
	}

	@Watch("playbackSettings", { deep: true })
	@Watch("pattern", { deep: true })
	onUpdate() {
		this.updatePlayer();
	}

	async editPattern() {
		this.editorId = null;
		await this.$nextTick();
		this.editorId = `bb-pattern-editor-dialog-${id()}`;
		await this.$nextTick();
		this.$bvModal.show(this.editorId);
	}

	createPlayer() {
		this.playerRef = createBeatbox(false);
		(this.player as Beatbox).onbeat = (beat) => {
			const $el = $(this.$el);
			$el.find(".position-marker").css("left", (beat / (this.player as Beatbox)._pattern.length) * ($el.outerWidth() as number) + "px");
		};
		this.updatePlayer();
	};

	updatePlayer() {
		if(!this.player)
			return;

		const patternObj = this.pattern;

		if(!patternObj)
			return;

		const playbackSettings = this.playbackSettings;

		const pattern = patternToBeatbox(patternObj, playbackSettings);

		this.player.setPattern(playbackSettings.length ? pattern.slice(0, playbackSettings.length*config.playTime + pattern.upbeat) : pattern);
		this.player.setUpbeat(pattern.upbeat);
		this.player.setBeatLength(60000/playbackSettings.speed/config.playTime);
		this.player.setRepeat(playbackSettings.loop || patternObj.loop);
	};

	playPattern() {
		if(this.player == null)
			this.createPlayer();

		const player = this.player as Beatbox;

		if(!player.playing) {
			stopAllPlayers();
			player.setPosition(0);
			player.play();
		} else {
			player.stop();
			player.setPosition(0);
		}
	};

	async restore() {
		if(await this.$bvModal.msgBoxConfirm(`Are you sure that you want to revert your modifications to ${this.patternName} (${this.tuneName})?`)) {
			events.$emit("update-state", createPattern(this.state, this.tuneName, this.patternName, defaultTunes.getPattern(this.tuneName, this.patternName) || undefined));
		}
	}

	handleDragStart(event: DragEvent) {
		const dragData: PatternDragData = {
			type: DragType.PLACEHOLDER,
			pattern: [ this.tuneName, this.patternName ]
		};
		(event.dataTransfer as DataTransfer).effectAllowed = this.dragEffect;
		setDragData(event, dragData);
		events.$emit("pattern-placeholder-drag-start");
	}

	handleDragEnd(event: DragEvent) {
		events.$emit("pattern-placeholder-drag-end");
	}
}