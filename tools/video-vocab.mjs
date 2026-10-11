// Check every caption form, including names: video tooltips should resolve all words.
import { loadAll, Lemma } from "./lib.mjs";
import { loadVideos } from "./video-content.mjs";
const {dict,errors}=loadAll();
const result=loadVideos();
if(errors.length || result.errors.length) throw new Error([...errors,...result.errors].join("\n"));
let missing=0;
const requested = process.argv.slice(2);
for(const v of result.videos.filter(v => !requested.length || requested.includes(v.id))){const forms=new Set(v.captions.flatMap(c=>(c.text.match(Lemma.WORD_RE)||[])));const gaps=[...forms].filter(w=>!v.glossary?.[Lemma.normalize(w)] && !Lemma.lookup(w,dict));missing+=gaps.length;console.log(v.id+": "+forms.size+" forms, "+gaps.length+" missing"+(gaps.length ? " — "+gaps.join(", " ) : ""));}
if(missing)process.exitCode=1;
