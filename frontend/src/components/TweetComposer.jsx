import { ImagePlus, Send } from 'lucide-react';
import { useRef, useState } from 'react';

export default function TweetComposer({ onCreate }) {
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const fileRef = useRef(null);
  const remaining = 280 - body.length;

  const submit = (event) => {
    event.preventDefault();
    onCreate({ body, image });
    setBody('');
    setImage('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={280}
        rows={2}
        placeholder="O que esta a acontecer?"
        aria-label="Texto do tweet"
      />
      {image && <img className="composer-preview" src={image} alt="Pre-visualizacao do tweet" />}
      <div className="composer-toolbar">
        <label className="icon-button" title="Adicionar imagem">
          <ImagePlus size={18} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
        </label>
        <span className={remaining < 30 ? 'counter warning' : 'counter'}>{remaining}</span>
        <button className="composer-submit-btn" disabled={!body.trim()} type="submit">
          <Send size={18} />
          Publicar
        </button>
      </div>
    </form>
  );
}
