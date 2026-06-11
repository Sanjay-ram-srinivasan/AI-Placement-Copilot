import { useState, useRef } from 'react';
import axios from 'axios';
import ScoreRing from '../components/ScoreRing';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { GlassCard, PageHeader, Skeleton } from '../components/ui';

const API = 'http://127.0.0.1:8000';

function extractScore(text) {
  if (!text) return 0;
  const m = text.match(/(\d{1,3})\s*(?:\/\s*100|%|out of 100)/i);
  return m ? Math.min(parseInt(m[1]), 100) : 0;
}

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setFileName(f.name);
      setAnalysis('');
      setError('');
      setScore(0);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a PDF resume first.'); return; }
    setError('');
    setAnalysis('');
    setScore(0);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await axios.post(`${API}/upload-resume`, form);
    } catch (e) {
      setError('Upload failed: ' + (e.response?.data?.detail || e.message));
      setUploading(false);
      return;
    }
    setUploading(false);
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API}/resume-analysis`);
      const result = res.data;
      if (result.error) {
        setError(result.error);
      } else {
        const text = result.analysis || '';
        setAnalysis(text);
        setScore(extractScore(text));
      }
    } catch (e) {
      setError('Analysis failed: ' + (e.response?.data?.detail || e.message));
    }
    setAnalyzing(false);
  };

  const loading = uploading || analyzing;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resume intelligence"
        title="Resume Analyzer"
        description="Upload your PDF resume to get an ATS score, skill analysis, and actionable improvements."
      />

      <div className="split-layout">
        <GlassCard className="sticky-panel">
          <div className="panel-title">
            <div>
              <h2>Resume Upload</h2>
              <p>PDF only. Existing upload and analysis APIs are unchanged.</p>
            </div>
            {file && <span className="chip chip-green">Ready</span>}
          </div>
          <div
            className={`drop-zone${dragOver ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="drop-zone-icon">{file ? 'OK' : 'PDF'}</div>
            <div className="drop-zone-title">{file ? fileName : 'Drop your resume here or click to browse'}</div>
            <div className="drop-zone-sub">PDF files only · Max 10MB</div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !file} style={{ marginTop: 16, width: '100%' }} id="analyze-resume-btn">
            {loading ? <><div className="spinner" />{uploading ? 'Uploading...' : 'Analyzing...'}</> : 'Analyze Resume'}
          </button>
          {error && <div className="banner banner-error" style={{ marginTop: 14 }}><span>{error}</span></div>}
        </GlassCard>

        <div style={{ display: 'grid', gap: 14 }}>
          {loading && (
            <GlassCard>
              <div className="panel-title"><h2>Analyzing resume</h2><span className="spinner" /></div>
              <Skeleton lines={7} />
            </GlassCard>
          )}

          {!analysis && !loading && (
            <GlassCard>
              <div className="score-section">
                <ScoreRing score={84} label="Preview" />
                <div className="score-meta">
                  <h3>Resume Score Analysis</h3>
                  <p>Your analysis will show ATS score, strengths, critical gaps, identified skills, and strategic recommendations.</p>
                  <span className="chip chip-purple">Awaiting resume</span>
                </div>
              </div>
            </GlassCard>
          )}

          {analysis && (
            <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
              {score > 0 && (
                <GlassCard>
                  <div className="score-section">
                    <ScoreRing score={score} label="ATS Score" />
                    <div className="score-meta">
                      <h3>ATS Compatibility Score</h3>
                      <p>{score >= 75 ? 'Strong resume with solid ATS compatibility.' : score >= 50 ? 'Moderate fit with clear improvement opportunities.' : 'Low score with significant resume gaps to address.'}</p>
                      <span className={`chip ${score >= 75 ? 'chip-green' : score >= 50 ? 'chip-amber' : 'chip-red'}`}>
                        {score >= 75 ? 'Interview Ready' : score >= 50 ? 'Needs Work' : 'Major Gaps'}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )}
              <GlassCard>
                <div className="panel-title">
                  <h2>Full Analysis</h2>
                  <span className="chip chip-cyan">{fileName}</span>
                </div>
                <MarkdownRenderer content={analysis} />
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
