import "./pattern-list-filter.scss";
import { getSortedTuneList, State } from "../../state/state";
import { tuneIsInCategory } from "../../state/tune";
import config, { Category } from "../../config";
import Vue from "vue";
import Component from "vue-class-component";
import template from "./pattern-list-filter.vue";
import { Prop, Watch } from "vue-property-decorator";

export interface Filter {
	text: string;
	cat: Category;
}

export const DEFAULT_FILTER: Filter = { text: "", cat: "all" };

export function filterPatternList(state: State, params?: Filter | null) {
	params = params || DEFAULT_FILTER;

	var ret = [ ];
	var tuneNames = getSortedTuneList(state);
	var text = params && params.text.trim().toLowerCase() || "";
	for(var i=0; i<tuneNames.length; i++) {
		if(text ? (tuneNames[i].toLowerCase().indexOf(text) != -1) : tuneIsInCategory(state.tunes[tuneNames[i]], params.cat))
			ret.push(tuneNames[i]);
	}
	return ret;
}

@Component({
	template
})
export default class PatternListFilter extends Vue {
	filterCats = config.filterCats;

	@Prop({ type: Object, default: () => ({ ...DEFAULT_FILTER }) })
	readonly value!: Filter;

	@Watch("value", { deep: true })
	onFilterChange(filter: Filter) {
		this.$emit("input", filter);
	}
}