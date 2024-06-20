import React, { useState, useEffect } from 'react';
import './App.css';

const lilStyle = {
    marginLeft: '-0.25em',
    marginTop: '0.45em',
    width: '25px',
    height: '25px',
    borderRadius: '25px',
    zIndex: '10',
}

const HiddenItem = (props) => {
  const { children, a: answer, c, answeredCheck, id } = props
  const answered = answeredCheck(id)
  return <><div style={{
     cursor: 'text',
    position: 'absolute',
    display: 'inline',
    opacity: answered ? '0.5' : '0',
  //  border: answered ? '1px solid black' : 'none',
    background: 'rgb(93, 196, 14)',
    ...(children ? {} : lilStyle), 
  } } onClick={() => {if(!children) c(id);}}></div>
  <span 
   label={id}
    style={children ? {
    //  border: answered ? '1px solid black' : 'none',
      background: answered ? 'rgb(93, 196, 14, 0.5)' : 'transparent',
      borderRadius: '10px', padding: answered ? '0.1em': '0px'
    } : {}}
     onClick={() => {if(children) c(id);}}>
    {answered ? <b>{answer}</b> : (children || '')}</span></>
}


function App() {

  const [answered, setAnswered ] = useState({})
  const c = id => setAnswered(ans => ({...ans, [id]: true}))
  const answeredCheck = id => answered[id]
  const H = props => {
      return <HiddenItem c={c} answeredCheck={answeredCheck} {...props}>{props.children}</HiddenItem> 
  }

  const totalCorrected = Object.values(answered).filter(x => x).length
  
  return (
    
    <div style={{fontFamily: 'serif', fontSize: '1.6em', margin: '4em', lineHeight: '1.4em'}}>
     <p><i>Click the mistakes to correct the text.</i></p>
      <p>A frog is any member of a diverse and largely carnivorous group of short-bodied<H id={1} a={','}/> tailless amphibians composing the order Anura (coming from the Ancient Greek ἀνούρα, literally 'without tail'). The oldest fossil "proto-frog" Triadobatrachus is known from the Early Triassic of Madagascar, but molecular clock dating <H id={2} a={'suggests'}>suggest</H> their split from other amphibians may <H id={3} a={'extend'}>extends</H> further back to the Permian, 265 million years ago. 
      Frogs are widely distributed<H id={10} a={', r'}>. R</H>anging from the tropics to subarctic regions<H id={4} a={','}/> but the greatest concentration of <H id={5} a={'species'}>specie's</H> diversity is in tropical rainforest. <H id={6} a={'Frogs'}>Frog's</H> account for around 88% of extant amphibian species. They are also one of the five most diverse <H  id={7} a={'vertebrate'}>verterbrate</H> orders. Warty frog species tend to be called toads<H id={8} a={','}/> but the distinction between frogs and toads is informal, not from taxonomy or <H id={9} a={'evolutionary'}>evolutionairy</H> history.
      </p>{/*<p>
An adult frog has a stout body, protruding eyes, anteriorly-attached tongue, limbs folded underneath, and no tail (the tail of tailed frogs is an extension of the male cloaca). Frogs have glandular skin, with secretions ranging from distasteful to toxic. Their skin varies in colour from well-camouflaged dappled brown, grey and green to vivid patterns of bright red or yellow and black to show toxicity and ward off predators. Adult frogs live in fresh water and on dry land; some species are adapted for living underground or in trees.
</p><p>
Frogs typically lay their eggs in water. The eggs hatch into aquatic larvae called tadpoles that have tails and internal gills. They have highly specialized rasping mouth parts suitable for herbivorous, omnivorous or planktivorous diets. The life cycle is completed when they metamorphose into adults. A few species deposit eggs on land or bypass the tadpole stage. Adult frogs generally have a carnivorous diet consisting of small invertebrates, but omnivorous species exist and a few feed on plant matter. Frog skin has a rich microbiome which is important to their health. Frogs are extremely efficient at converting what they eat into body mass. They are an important food source for predators and part of the food web dynamics of many of the world's ecosystems. The skin is semi-permeable, making them susceptible to dehydration, so they either live in moist places or have special adaptations to deal with dry habitats. Frogs produce a wide range of vocalizations, particularly in their breeding season, and exhibit many different kinds of complex behaviors to attract mates, to fend off predators and to generally survive.
</p><p>
Frogs are valued as food by humans and also have many cultural roles in literature, symbolism and religion. They are also seen as environmental bellwethers, with declines in frog populations often viewed as early warning signs of environmental damage. Frog populations have declined significantly since the 1950s. More than one third of species are considered to be threatened with extinction and over 120 are believed to have become extinct since the 1980s. The number of malformations among frogs is on the rise and an emerging fungal disease, chytridiomycosis, has spread around the world. Conservation biologists are working to understand the causes of these problems and to resolve them.
</p>*/}<p style={{color: totalCorrected === 9 ? 'green' : 'black' }}>
  <b>{totalCorrected}</b> / 10 corrected
</p>

<p style={{fontSize: '0.5em'}}>Adapted from <a href="https://en.wikipedia.org/wiki/Frog">Wikipedia: Frog</a> under Creative Commons license <a href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License">CC BY-SA 4.0</a></p>
</div>
  );
}

export default App;
